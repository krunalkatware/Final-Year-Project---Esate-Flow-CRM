"""
EstateFlow — Enterprise File Storage & Management Router
=========================================================
Handles uploads, validations, previews, downloads, and replacement for properties,
KYC documents, builder agreements, and receipts.
"""
import os
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.config.database import get_db
from server.core.dependencies import get_current_user_optional
from server.core.security import decode_token
from server.models.user import User, UserRole
from server.models.booking import Booking, BookingDocument
from server.models.admin import AdminUser

router = APIRouter(prefix="/api/files", tags=["Enterprise File Storage"])

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/svg+xml",
    "application/pdf", "video/mp4", "video/quicktime",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB limit

SENSITIVE_CATEGORIES = {"kyc", "documents", "agreements", "receipts", "contracts", "identity", "customer_kyc"}


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form("general"),
    current_user = Depends(get_current_user_optional),
):
    """
    Validate and upload an enterprise document/media file.
    Supports property images, agreements, KYC, receipts, builder documents.
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: images, PDFs, MP4 videos, docs."
        )

    # Read content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds maximum size limit of 15MB")

    # Sanitize category
    safe_category = "".join(c for c in category if c.isalnum() or c in ("-", "_")).strip()
    if not safe_category:
        safe_category = "general"

    category_dir = os.path.join(UPLOAD_DIR, safe_category)
    os.makedirs(category_dir, exist_ok=True)

    clean_name = os.path.basename(file.filename or "upload").replace(" ", "_")
    safe_filename = f"{os.urandom(8).hex()}_{clean_name}"
    file_path = os.path.join(category_dir, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    relative_url = f"/api/files/download/{safe_category}/{safe_filename}"

    return {
        "success": True,
        "filename": safe_filename,
        "original_filename": file.filename,
        "category": safe_category,
        "mime_type": file.content_type,
        "size_bytes": len(content),
        "url": relative_url,
    }


@router.get("/download/{category}/{filename}")
def download_file(
    category: str,
    filename: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Serve or download a stored file.
    - Public categories (property photos, public assets): open access with path traversal protection.
    - Sensitive categories (KYC, documents, agreements, receipts): strict authentication & customer-data isolation (IDOR protection).
    """
    # Sanitize category and filename against path traversal
    if ".." in category or "/" in category or "\\" in category:
        raise HTTPException(status_code=400, detail="Invalid category path")
    if ".." in filename or "/" in filename or "\\" in filename or "\x00" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    safe_category = "".join(c for c in category if c.isalnum() or c in ("-", "_")).strip()
    safe_filename = os.path.basename(filename.strip())

    if not safe_category or not safe_filename:
        raise HTTPException(status_code=400, detail="Invalid file path")

    upload_dir_real = os.path.realpath(UPLOAD_DIR)
    file_path = os.path.realpath(os.path.join(UPLOAD_DIR, safe_category, safe_filename))

    # Strict path traversal check
    if not file_path.startswith(upload_dir_real + os.sep):
        raise HTTPException(status_code=403, detail="Access denied: invalid file path")

    # Authorization Check for Sensitive Categories
    if safe_category.lower() in SENSITIVE_CATEGORIES:
        user = current_user
        if not user and token:
            payload = decode_token(token)
            if payload and payload.get("sub"):
                user = db.query(User).filter(User.id == payload.get("sub"), User.is_active == True).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to access protected documents."
            )

        is_admin = (
            user.role in (UserRole.admin, "admin", "super_admin") or
            db.query(AdminUser).filter(AdminUser.user_id == user.id, AdminUser.is_active == True).first() is not None
        )

        if not is_admin:
            # Customer isolation: Must own the document
            doc_match = db.query(BookingDocument).filter(
                or_(
                    BookingDocument.customer_id == user.id,
                    BookingDocument.booking_id.in_(
                        db.query(Booking.id).filter(Booking.customer_id == user.id)
                    )
                ),
                or_(
                    BookingDocument.file_name == safe_filename,
                    BookingDocument.file_url.contains(safe_filename),
                    BookingDocument.storage_path.contains(safe_filename)
                )
            ).first()

            if not doc_match:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. You can only view your own documents."
                )

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, filename=safe_filename)


@router.delete("/{category}/{filename}")
def delete_file(
    category: str,
    filename: str,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Delete a stored file. Restricted to authenticated authorized users."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to delete files.")

    safe_category = os.path.basename(category.replace("..", "").strip("/"))
    safe_filename = os.path.basename(filename.replace("..", "").strip("/"))

    if not safe_category or not safe_filename:
        raise HTTPException(status_code=400, detail="Invalid file path")

    upload_dir_real = os.path.realpath(UPLOAD_DIR)
    file_path = os.path.realpath(os.path.join(UPLOAD_DIR, safe_category, safe_filename))

    if not file_path.startswith(upload_dir_real + os.sep):
        raise HTTPException(status_code=403, detail="Access denied")

    is_admin = (
        current_user.role in (UserRole.admin, "admin", "super_admin") or
        db.query(AdminUser).filter(AdminUser.user_id == current_user.id).first() is not None
    )
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only administrators can delete storage files.")

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    os.remove(file_path)
    return {"success": True, "message": "File deleted successfully"}

import csv
import io
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_

from server.config.database import get_db
from server.core.dependencies import get_current_admin
from server.models.admin import AdminUser
from server.models.lead import (
    Lead, LeadActivity, LeadNote, LeadStageHistory, LeadReminder,
    LeadDocument, LeadStage, LeadSource, LeadPriority
)
from server.models.user import User
from server.models.property import Property
from server.models.builder import Builder

router = APIRouter(prefix="/api/admin/leads", tags=["Admin CRM Leads"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class LeadCreateSchema(BaseModel):
    customer_id: Optional[str] = None
    first_name: str = Field(..., min_length=1)
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: str = Field(..., min_length=5)
    alternate_phone: Optional[str] = None
    occupation: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    budget_min: Optional[float] = 0.0
    budget_max: Optional[float] = 0.0
    preferred_bhk: Optional[str] = None
    preferred_property_type: Optional[str] = None
    buying_timeline: Optional[str] = "Immediate"
    investment_purpose: Optional[str] = "End Use"
    property_id: Optional[int] = None
    builder_id: Optional[int] = None
    stage: LeadStage = LeadStage.new
    source: LeadSource = LeadSource.website
    priority: LeadPriority = LeadPriority.medium
    lead_score: Optional[int] = 50
    estimated_deal_value: Optional[float] = 0.0
    assigned_to_id: Optional[int] = None
    notes_summary: Optional[str] = None


class LeadUpdateSchema(BaseModel):
    customer_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    occupation: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    preferred_bhk: Optional[str] = None
    preferred_property_type: Optional[str] = None
    buying_timeline: Optional[str] = None
    investment_purpose: Optional[str] = None
    property_id: Optional[int] = None
    builder_id: Optional[int] = None
    stage: Optional[LeadStage] = None
    source: Optional[LeadSource] = None
    priority: Optional[LeadPriority] = None
    lead_score: Optional[int] = None
    estimated_deal_value: Optional[float] = None
    assigned_to_id: Optional[int] = None
    loss_reason: Optional[str] = None
    notes_summary: Optional[str] = None


class StageUpdateSchema(BaseModel):
    stage: LeadStage
    loss_reason: Optional[str] = None
    notes: Optional[str] = None


class AssignLeadSchema(BaseModel):
    assigned_to_id: int
    notes: Optional[str] = None


class NoteCreateSchema(BaseModel):
    content: str = Field(..., min_length=1)
    is_pinned: bool = False


class ReminderCreateSchema(BaseModel):
    title: str = Field(..., min_length=1)
    reminder_type: str = "call"
    due_date: datetime
    notes: Optional[str] = None


class ActivityCreateSchema(BaseModel):
    activity_type: str # call, meeting, email, whatsapp, site_visit
    title: str
    description: Optional[str] = None


class BulkAssignSchema(BaseModel):
    lead_ids: List[int]
    assigned_to_id: int


class BulkStageSchema(BaseModel):
    lead_ids: List[int]
    stage: LeadStage


class BulkDeleteSchema(BaseModel):
    lead_ids: List[int]


# ── Serializers ───────────────────────────────────────────────────────────────

def _serialize_lead(lead: Lead) -> dict:
    return {
        "id": lead.id,
        "uuid": lead.uuid,
        "lead_number": lead.lead_number,
        "customer_id": lead.customer_id,
        "first_name": lead.first_name,
        "last_name": lead.last_name,
        "full_name": f"{lead.first_name} {lead.last_name or ''}".strip(),
        "email": lead.email,
        "phone": lead.phone,
        "alternate_phone": lead.alternate_phone,
        "occupation": lead.occupation,
        "city": lead.city,
        "locality": lead.locality,
        "budget_min": lead.budget_min,
        "budget_max": lead.budget_max,
        "preferred_bhk": lead.preferred_bhk,
        "preferred_property_type": lead.preferred_property_type,
        "buying_timeline": lead.buying_timeline,
        "investment_purpose": lead.investment_purpose,
        "property_id": lead.property_id,
        "property_name": lead.property_rel.name if lead.property_rel else None,
        "builder_id": lead.builder_id,
        "builder_name": lead.builder_rel.name if lead.builder_rel else None,
        "stage": lead.stage,
        "source": lead.source,
        "priority": lead.priority,
        "lead_score": lead.lead_score,
        "estimated_deal_value": lead.estimated_deal_value,
        "loss_reason": lead.loss_reason,
        "notes_summary": lead.notes_summary,
        "assigned_to_id": lead.assigned_to_id,
        "assigned_agent_name": f"{lead.assigned_agent.first_name} {lead.assigned_agent.last_name or ''}".strip() if lead.assigned_agent else "Unassigned",
        "is_active": lead.is_active,
        "is_archived": lead.is_archived,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
        "updated_at": lead.updated_at.isoformat() if lead.updated_at else None,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/crm-stats")
def get_crm_stats(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Aggregate stats for the Enterprise CRM Dashboard."""
    total_leads = db.query(func.count(Lead.id)).filter(Lead.is_active == True).scalar() or 0
    hot_leads = db.query(func.count(Lead.id)).filter(Lead.priority.in_([LeadPriority.hot, LeadPriority.vip]), Lead.is_active == True).scalar() or 0
    
    today_start = datetime.combine(date.today(), datetime.min.time())
    new_today = db.query(func.count(Lead.id)).filter(Lead.created_at >= today_start, Lead.is_active == True).scalar() or 0
    lost_leads = db.query(func.count(Lead.id)).filter(Lead.stage == LeadStage.lost, Lead.is_active == True).scalar() or 0
    booked_leads = db.query(func.count(Lead.id)).filter(Lead.stage == LeadStage.booked, Lead.is_active == True).scalar() or 0
    
    conversion_rate = round((booked_leads / total_leads * 100), 1) if total_leads > 0 else 0.0
    
    # Stage breakdown
    stage_counts = db.query(Lead.stage, func.count(Lead.id)).filter(Lead.is_active == True).group_by(Lead.stage).all()
    funnel = {st.value: 0 for st in LeadStage}
    for s, count in stage_counts:
        val = s.value if hasattr(s, 'value') else str(s)
        funnel[val] = count
        
    # Source breakdown
    source_counts = db.query(Lead.source, func.count(Lead.id)).filter(Lead.is_active == True).group_by(Lead.source).all()
    sources = []
    for src, count in source_counts:
        val = src.value if hasattr(src, 'value') else str(src)
        sources.append({"source": val.replace("_", " ").title(), "count": count})
        
    # Total revenue forecast
    est_value = db.query(func.sum(Lead.estimated_deal_value)).filter(Lead.is_active == True).scalar() or 0.0
    
    # Pending Reminders today
    pending_reminders = db.query(func.count(LeadReminder.id)).filter(LeadReminder.status == "pending", LeadReminder.due_date <= datetime.now()).scalar() or 0

    return {
        "summary": {
            "total_leads": total_leads,
            "new_leads_today": new_today,
            "hot_leads": hot_leads,
            "lost_leads": lost_leads,
            "booked_leads": booked_leads,
            "conversion_rate": conversion_rate,
            "estimated_pipeline_value": est_value,
            "pending_reminders": pending_reminders,
        },
        "sales_funnel": funnel,
        "lead_sources": sources,
    }


@router.get("")
def list_leads(
    search: Optional[str] = None,
    stage: Optional[str] = None,
    source: Optional[str] = None,
    priority: Optional[str] = None,
    city: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=500),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List leads with filtering, searching, and pagination."""
    query = db.query(Lead).options(
        joinedload(Lead.property_rel),
        joinedload(Lead.builder_rel),
        joinedload(Lead.assigned_agent),
    ).filter(Lead.is_active == True)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Lead.first_name.ilike(pattern),
                Lead.last_name.ilike(pattern),
                Lead.email.ilike(pattern),
                Lead.phone.ilike(pattern),
                Lead.lead_number.ilike(pattern),
                Lead.locality.ilike(pattern),
            )
        )

    if stage:
        query = query.filter(Lead.stage == stage)
    if source:
        query = query.filter(Lead.source == source)
    if priority:
        query = query.filter(Lead.priority == priority)
    if city:
        query = query.filter(Lead.city.ilike(f"%{city}%"))
    if assigned_to_id:
        query = query.filter(Lead.assigned_to_id == assigned_to_id)

    # Sorting
    sort_col = getattr(Lead, sort_by, Lead.created_at)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(sort_col)

    total = query.count()
    leads = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "items": [_serialize_lead(l) for l in leads],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/{lead_id}")
def get_lead_detail(
    lead_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Fetch complete lead profile including activities, notes, reminders, and stage history."""
    lead = db.query(Lead).options(
        joinedload(Lead.property_rel),
        joinedload(Lead.builder_rel),
        joinedload(Lead.assigned_agent),
        joinedload(Lead.activities),
        joinedload(Lead.notes),
        joinedload(Lead.reminders),
        joinedload(Lead.stage_history),
        joinedload(Lead.documents),
    ).filter(Lead.id == lead_id, Lead.is_active == True).first()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    res = _serialize_lead(lead)
    res["activities"] = [
        {
            "id": a.id,
            "type": a.activity_type,
            "title": a.title,
            "description": a.description,
            "performed_by": a.performed_by,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in lead.activities
    ]
    res["notes"] = [
        {
            "id": n.id,
            "content": n.content,
            "is_pinned": n.is_pinned,
            "created_by": n.created_by,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in lead.notes
    ]
    res["reminders"] = [
        {
            "id": r.id,
            "title": r.title,
            "type": r.reminder_type,
            "due_date": r.due_date.isoformat() if r.due_date else None,
            "status": r.status,
            "notes": r.notes,
        }
        for r in lead.reminders
    ]
    res["stage_history"] = [
        {
            "id": h.id,
            "old_stage": h.old_stage,
            "new_stage": h.new_stage,
            "changed_by": h.changed_by,
            "notes": h.notes,
            "created_at": h.created_at.isoformat() if h.created_at else None,
        }
        for h in lead.stage_history
    ]
    res["documents"] = [
        {
            "id": d.id,
            "title": d.title,
            "document_type": d.document_type,
            "document_url": d.document_url,
            "uploaded_by": d.uploaded_by,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in lead.documents
    ]
    return res


@router.post("")
def create_lead(
    data: LeadCreateSchema,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a new CRM lead."""
    # Generate unique lead number e.g. LD-2026-0042
    count = db.query(func.count(Lead.id)).scalar() or 0
    lead_num = f"LD-2026-{(count + 1):04d}"

    lead = Lead(
        customer_id=data.customer_id.strip() if data.customer_id and data.customer_id.strip() else None,
        lead_number=lead_num,
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip() if data.last_name and data.last_name.strip() else None,
        email=data.email.strip() if data.email and data.email.strip() else None,
        phone=data.phone.strip(),
        alternate_phone=data.alternate_phone.strip() if data.alternate_phone and data.alternate_phone.strip() else None,
        occupation=data.occupation.strip() if data.occupation and data.occupation.strip() else None,
        city=data.city.strip() if data.city and data.city.strip() else None,
        locality=data.locality.strip() if data.locality and data.locality.strip() else None,
        budget_min=data.budget_min or 0.0,
        budget_max=data.budget_max or 0.0,
        preferred_bhk=data.preferred_bhk if data.preferred_bhk else None,
        preferred_property_type=data.preferred_property_type if data.preferred_property_type else None,
        buying_timeline=data.buying_timeline or "Immediate",
        investment_purpose=data.investment_purpose or "End Use",
        property_id=data.property_id,
        builder_id=data.builder_id,
        stage=data.stage,
        source=data.source,
        priority=data.priority,
        lead_score=data.lead_score if data.lead_score is not None else 50,
        estimated_deal_value=data.estimated_deal_value or 0.0,
        assigned_to_id=data.assigned_to_id,
        notes_summary=data.notes_summary.strip() if data.notes_summary and data.notes_summary.strip() else None,
        created_by=f"{current_admin.first_name} {current_admin.last_name or ''}".strip(),
    )
    db.add(lead)
    db.flush()

    # Record initial stage history
    stage_hist = LeadStageHistory(
        lead_id=lead.id,
        old_stage=None,
        new_stage=lead.stage.value,
        changed_by=lead.created_by,
        notes="Lead created in system",
    )
    db.add(stage_hist)

    # Record initial creation activity
    act = LeadActivity(
        lead_id=lead.id,
        activity_type="created",
        title="Lead Created",
        description=f"Lead created via {data.source.value.title()} by {lead.created_by}.",
        performed_by=lead.created_by,
    )
    db.add(act)

    db.commit()
    db.refresh(lead)
    return {"message": "Lead created successfully", "lead_id": lead.id, "lead_number": lead.lead_number}


@router.put("/{lead_id}")
def update_lead(
    lead_id: int,
    data: LeadUpdateSchema,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update lead specifications and notes."""
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_active == True).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_dict = data.model_dump(exclude_unset=True)
    admin_name = f"{current_admin.first_name} {current_admin.last_name or ''}".strip()

    # Stage change tracking
    if "stage" in update_dict and update_dict["stage"] != lead.stage:
        old_s = lead.stage.value
        new_s = update_dict["stage"].value if hasattr(update_dict["stage"], "value") else str(update_dict["stage"])
        
        hist = LeadStageHistory(
            lead_id=lead.id,
            old_stage=old_s,
            new_stage=new_s,
            changed_by=admin_name,
            notes=update_dict.get("loss_reason") or "Stage updated via edit form",
        )
        db.add(hist)

        act = LeadActivity(
            lead_id=lead.id,
            activity_type="stage_change",
            title=f"Stage Changed to {new_s.replace('_', ' ').title()}",
            description=f"Moved from '{old_s}' to '{new_s}' by {admin_name}.",
            performed_by=admin_name,
        )
        db.add(act)

    for field, val in update_dict.items():
        setattr(lead, field, val)

    lead.updated_by = admin_name
    db.commit()
    return {"message": "Lead updated successfully"}


@router.patch("/{lead_id}/stage")
def update_lead_stage(
    lead_id: int,
    data: StageUpdateSchema,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Kanban drag & drop stage transition update."""
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_active == True).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    old_s = lead.stage.value
    new_s = data.stage.value
    admin_name = f"{current_admin.first_name} {current_admin.last_name or ''}".strip()

    if old_s != new_s:
        lead.stage = data.stage
        if data.loss_reason:
            lead.loss_reason = data.loss_reason

        hist = LeadStageHistory(
            lead_id=lead.id,
            old_stage=old_s,
            new_stage=new_s,
            changed_by=admin_name,
            notes=data.notes or f"Moved via Kanban board to {new_s}",
        )
        db.add(hist)

        act = LeadActivity(
            lead_id=lead.id,
            activity_type="stage_change",
            title=f"Stage moved to {new_s.replace('_', ' ').title()}",
            description=f"Kanban drag & drop from '{old_s}' to '{new_s}' by {admin_name}.",
            performed_by=admin_name,
        )
        db.add(act)

        db.commit()

    return {"message": "Lead stage updated", "lead_id": lead.id, "new_stage": new_s}


@router.post("/{lead_id}/notes")
def add_lead_note(
    lead_id: int,
    data: NoteCreateSchema,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Add an internal note to a lead."""
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_active == True).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    admin_name = f"{current_admin.first_name} {current_admin.last_name or ''}".strip()
    note = LeadNote(
        lead_id=lead.id,
        content=data.content,
        is_pinned=data.is_pinned,
        created_by=admin_name,
    )
    db.add(note)

    act = LeadActivity(
        lead_id=lead.id,
        activity_type="note",
        title="Note Added",
        description=f"Internal note added by {admin_name}.",
        performed_by=admin_name,
    )
    db.add(act)

    db.commit()
    return {"message": "Note added successfully"}


@router.post("/{lead_id}/reminders")
def add_lead_reminder(
    lead_id: int,
    data: ReminderCreateSchema,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Schedule a follow-up reminder for a lead."""
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_active == True).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    admin_name = f"{current_admin.first_name} {current_admin.last_name or ''}".strip()
    rem = LeadReminder(
        lead_id=lead.id,
        title=data.title,
        reminder_type=data.reminder_type,
        due_date=data.due_date,
        notes=data.notes,
        assigned_to=admin_name,
    )
    db.add(rem)

    act = LeadActivity(
        lead_id=lead.id,
        activity_type="reminder",
        title=f"Follow-up Scheduled: {data.title}",
        description=f"Reminder scheduled for {data.due_date.strftime('%b %d, %Y %I:%M %p')}.",
        performed_by=admin_name,
    )
    db.add(act)

    db.commit()
    return {"message": "Reminder scheduled successfully"}


@router.delete("/{lead_id}")
def delete_lead(
    lead_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete or soft-delete lead record."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully"}


@router.get("/export")
def export_leads_csv(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Export all CRM leads as streaming CSV file."""
    leads = db.query(Lead).filter(Lead.is_active == True).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Lead Number", "First Name", "Last Name", "Email", "Phone", "City",
        "Stage", "Source", "Priority", "Budget Min", "Budget Max", "Lead Score", "Estimated Value", "Created At"
    ])

    for l in leads:
        writer.writerow([
            l.lead_number, l.first_name, l.last_name or "", l.email or "", l.phone, l.city or "",
            l.stage.value, l.source.value, l.priority.value, l.budget_min, l.budget_max, l.lead_score,
            l.estimated_deal_value, l.created_at.strftime("%Y-%m-%d %H:%M") if l.created_at else ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=estateflow_leads_{date.today()}.csv"}
    )

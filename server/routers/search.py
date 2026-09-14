"""
EstateFlow — Universal Global Instant Search Router
===================================================
Provides instant search across all 11 core platform entities.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.config.database import get_db
from server.models.property import Property
from server.models.builder import Builder
from server.models.customer import Customer
from server.models.booking import Booking
from server.models.lead import Lead
from server.models.site_visit import SiteVisit
from server.models.review import Review
from server.models.revenue import RevenueRule, Wallet
from server.models.investment import Investment

router = APIRouter(prefix="/api/search", tags=["Global Instant Search"])


@router.get("/global")
def search_global(
    q: str = Query(..., min_length=1, description="Search query keyword"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Search instantly across Properties, Builders, Customers, Bookings, Leads,
    Site Visits, Reviews, Revenue Rules, Wallets, and Investments.
    """
    term = f"%{q.strip()}%"
    results = []

    # 1. Properties
    properties = db.query(Property).filter(
        or_(Property.title.ilike(term), Property.location.ilike(term), Property.city.ilike(term))
    ).limit(5).all()
    for p in properties:
        results.append({
            "category": "Property",
            "title": p.title,
            "subtitle": f"{p.city} • ₹{p.price:,.0f}" if p.price else p.city,
            "url": f"/admin/properties/view/{p.id}",
            "id": p.id,
        })

    # 2. Builders
    builders = db.query(Builder).filter(
        or_(Builder.name.ilike(term), Builder.company_name.ilike(term))
    ).limit(5).all()
    for b in builders:
        results.append({
            "category": "Builder",
            "title": b.name or b.company_name,
            "subtitle": f"{b.city or 'Pan-India'} • {b.total_projects or 0} Projects",
            "url": f"/admin/builders/view/{b.id}",
            "id": b.id,
        })

    # 3. Customers
    customers = db.query(Customer).filter(
        or_(Customer.full_name.ilike(term), Customer.email.ilike(term), Customer.phone.ilike(term))
    ).limit(5).all()
    for c in customers:
        results.append({
            "category": "Customer",
            "title": c.full_name or c.email,
            "subtitle": c.email,
            "url": f"/admin/crm/customers/{c.id}",
            "id": c.id,
        })

    # 4. Leads
    leads = db.query(Lead).filter(
        or_(Lead.name.ilike(term), Lead.email.ilike(term), Lead.phone.ilike(term))
    ).limit(5).all()
    for l in leads:
        results.append({
            "category": "Lead",
            "title": l.name,
            "subtitle": f"Stage: {l.stage.value if hasattr(l.stage, 'value') else l.stage}",
            "url": f"/admin/crm/leads/{l.id}",
            "id": l.id,
        })

    # 5. Bookings
    bookings = db.query(Booking).filter(
        or_(Booking.booking_reference.ilike(term), Booking.status.ilike(term))
    ).limit(5).all()
    for bk in bookings:
        results.append({
            "category": "Booking",
            "title": f"Booking #{bk.booking_reference or bk.id}",
            "subtitle": f"Status: {bk.status}",
            "url": f"/admin/bookings/{bk.id}",
            "id": bk.id,
        })

    # 6. Site Visits
    site_visits = db.query(SiteVisit).filter(
        or_(SiteVisit.visitor_name.ilike(term), SiteVisit.status.ilike(term))
    ).limit(5).all()
    for sv in site_visits:
        results.append({
            "category": "Site Visit",
            "title": f"Visit for {sv.visitor_name or 'Client'}",
            "subtitle": f"Status: {sv.status}",
            "url": f"/admin/site-visits/{sv.id}",
            "id": sv.id,
        })

    # 7. Investments
    investments = db.query(Investment).filter(
        or_(Investment.property_name.ilike(term), Investment.status.ilike(term))
    ).limit(5).all()
    for inv in investments:
        results.append({
            "category": "Investment",
            "title": inv.property_name or f"Investment #{inv.id}",
            "subtitle": f"₹{inv.investment_amount:,.0f} • {inv.status.value if hasattr(inv.status, 'value') else inv.status}",
            "url": "/dashboard/investments",
            "id": inv.id,
        })

    # 8. Revenue Rules
    rules = db.query(RevenueRule).filter(
        or_(RevenueRule.name.ilike(term), RevenueRule.role.ilike(term))
    ).limit(5).all()
    for r in rules:
        results.append({
            "category": "Revenue Rule",
            "title": r.name,
            "subtitle": f"Role: {r.role.value if hasattr(r.role, 'value') else r.role}",
            "url": "/admin/revenue/rules",
            "id": r.id,
        })

    return {
        "query": q,
        "total": len(results),
        "results": results[:limit],
    }

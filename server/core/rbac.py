import enum
from typing import List, Dict, Set


class AdminRoleEnum(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    FINANCE_MANAGER = "finance_manager"
    BUILDER = "builder"
    BROKER = "broker"
    SALES_MANAGER = "sales_manager"
    SALES_EXECUTIVE = "sales_executive"
    CUSTOMER_SUPPORT = "customer_support"
    INVESTOR = "investor"
    CUSTOMER = "customer"


class AdminPermissionEnum(str, enum.Enum):
    MANAGE_ALL = "manage_all"
    MANAGE_PROPERTIES = "manage_properties"
    MANAGE_BUILDERS = "manage_builders"
    MANAGE_CUSTOMERS = "manage_customers"
    MANAGE_BOOKINGS = "manage_bookings"
    MANAGE_REVIEWS = "manage_reviews"
    MANAGE_REPORTS = "manage_reports"
    MANAGE_LEADS = "manage_leads"
    MANAGE_SITE_VISITS = "manage_site_visits"
    MANAGE_BOOKING_STATUS = "manage_booking_status"
    MANAGE_TICKETS = "manage_tickets"
    MANAGE_NOTIFICATIONS = "manage_notifications"
    MANAGE_REVENUE = "manage_revenue"
    MANAGE_WALLETS = "manage_wallets"
    MANAGE_INVESTMENTS = "manage_investments"
    MANAGE_AUDIT_LOGS = "manage_audit_logs"


ROLE_DISPLAY_NAMES: Dict[str, str] = {
    AdminRoleEnum.SUPER_ADMIN.value: "Super Admin",
    AdminRoleEnum.ADMIN.value: "Admin",
    AdminRoleEnum.FINANCE_MANAGER.value: "Finance Manager",
    AdminRoleEnum.BUILDER.value: "Builder / Developer",
    AdminRoleEnum.BROKER.value: "Broker / Channel Partner",
    AdminRoleEnum.SALES_MANAGER.value: "Sales Manager",
    AdminRoleEnum.SALES_EXECUTIVE.value: "Sales Executive",
    AdminRoleEnum.CUSTOMER_SUPPORT.value: "Customer Support",
    AdminRoleEnum.INVESTOR.value: "Investor / Fractional Owner",
    AdminRoleEnum.CUSTOMER.value: "Customer",
}

# Declarative permissions matrix
ROLE_PERMISSIONS_MATRIX: Dict[str, List[str]] = {
    AdminRoleEnum.SUPER_ADMIN.value: [
        AdminPermissionEnum.MANAGE_ALL.value,
        AdminPermissionEnum.MANAGE_PROPERTIES.value,
        AdminPermissionEnum.MANAGE_BUILDERS.value,
        AdminPermissionEnum.MANAGE_CUSTOMERS.value,
        AdminPermissionEnum.MANAGE_BOOKINGS.value,
        AdminPermissionEnum.MANAGE_REVIEWS.value,
        AdminPermissionEnum.MANAGE_REPORTS.value,
        AdminPermissionEnum.MANAGE_LEADS.value,
        AdminPermissionEnum.MANAGE_SITE_VISITS.value,
        AdminPermissionEnum.MANAGE_BOOKING_STATUS.value,
        AdminPermissionEnum.MANAGE_TICKETS.value,
        AdminPermissionEnum.MANAGE_NOTIFICATIONS.value,
        AdminPermissionEnum.MANAGE_REVENUE.value,
        AdminPermissionEnum.MANAGE_WALLETS.value,
        AdminPermissionEnum.MANAGE_INVESTMENTS.value,
        AdminPermissionEnum.MANAGE_AUDIT_LOGS.value,
    ],
    AdminRoleEnum.ADMIN.value: [
        AdminPermissionEnum.MANAGE_PROPERTIES.value,
        AdminPermissionEnum.MANAGE_BUILDERS.value,
        AdminPermissionEnum.MANAGE_CUSTOMERS.value,
        AdminPermissionEnum.MANAGE_BOOKINGS.value,
        AdminPermissionEnum.MANAGE_REVIEWS.value,
        AdminPermissionEnum.MANAGE_REPORTS.value,
        AdminPermissionEnum.MANAGE_REVENUE.value,
        AdminPermissionEnum.MANAGE_WALLETS.value,
    ],
    AdminRoleEnum.FINANCE_MANAGER.value: [
        AdminPermissionEnum.MANAGE_REVENUE.value,
        AdminPermissionEnum.MANAGE_WALLETS.value,
        AdminPermissionEnum.MANAGE_REPORTS.value,
        AdminPermissionEnum.MANAGE_BOOKINGS.value,
    ],
    AdminRoleEnum.BUILDER.value: [
        AdminPermissionEnum.MANAGE_PROPERTIES.value,
        AdminPermissionEnum.MANAGE_BOOKINGS.value,
        AdminPermissionEnum.MANAGE_SITE_VISITS.value,
    ],
    AdminRoleEnum.BROKER.value: [
        AdminPermissionEnum.MANAGE_LEADS.value,
        AdminPermissionEnum.MANAGE_SITE_VISITS.value,
        AdminPermissionEnum.MANAGE_CUSTOMERS.value,
    ],
    AdminRoleEnum.SALES_MANAGER.value: [
        AdminPermissionEnum.MANAGE_LEADS.value,
        AdminPermissionEnum.MANAGE_CUSTOMERS.value,
        AdminPermissionEnum.MANAGE_SITE_VISITS.value,
        AdminPermissionEnum.MANAGE_BOOKING_STATUS.value,
    ],
    AdminRoleEnum.SALES_EXECUTIVE.value: [
        AdminPermissionEnum.MANAGE_CUSTOMERS.value,
        AdminPermissionEnum.MANAGE_LEADS.value,
        AdminPermissionEnum.MANAGE_SITE_VISITS.value,
    ],
    AdminRoleEnum.CUSTOMER_SUPPORT.value: [
        AdminPermissionEnum.MANAGE_REVIEWS.value,
        AdminPermissionEnum.MANAGE_TICKETS.value,
        AdminPermissionEnum.MANAGE_NOTIFICATIONS.value,
    ],
    AdminRoleEnum.INVESTOR.value: [
        AdminPermissionEnum.MANAGE_INVESTMENTS.value,
    ],
    AdminRoleEnum.CUSTOMER.value: [],
}



def has_permission(user_permissions: Set[str], required_permission: str) -> bool:
    if AdminPermissionEnum.MANAGE_ALL.value in user_permissions:
        return True
    return required_permission in user_permissions

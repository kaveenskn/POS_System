from fastapi import APIRouter

from app.api.v1.endpoints import (
    customers,
    dashboard,
    employees,
    expenses,
    financial,
    health,
    invoices,
    products,
    reports,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(financial.router, prefix="/financial", tags=["financial"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])

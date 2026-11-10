from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get("/metrics", response_model=DashboardResponse)
def get_dashboard_metrics(
    db: Session = Depends(get_db),  # noqa: B008
) -> DashboardResponse:
    """Retrieve comprehensive real-time dashboard metrics computed dynamically from the database.
    
    Includes sales KPIs, inventory volume, low-stock warnings, 7-day and 6-month sales trends,
    top selling spare parts, and recent transactions. Zero hardcoded data.
    """
    service = DashboardService(db)
    return service.get_metrics()

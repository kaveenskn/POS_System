from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.financial import FinancialSummary
from app.services.financial import FinancialService

router = APIRouter()


@router.get("/summary", response_model=FinancialSummary)
def get_financial_summary(
    db: Session = Depends(get_db),  # noqa: B008
) -> FinancialSummary:
    service = FinancialService(db)
    return service.get_summary()

import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.expense import ExpenseCategory
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseListResponse,
    ExpenseResponse,
    ExpenseSummary,
    ExpenseUpdate,
)
from app.services.expense import ExpenseService

router = APIRouter()


@router.get("/summary", response_model=ExpenseSummary)
def get_expense_summary(
    date_from: datetime.date | None = Query(None),  # noqa: B008
    date_to: datetime.date | None = Query(None),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> ExpenseSummary:
    service = ExpenseService(db)
    return service.get_summary(date_from=date_from, date_to=date_to)


@router.get("", response_model=ExpenseListResponse)
def list_expenses(
    skip: int = Query(0, ge=0),  # noqa: B008
    limit: int = Query(50, ge=1, le=100),  # noqa: B008
    search: str | None = Query(None, max_length=200),  # noqa: B008
    category: ExpenseCategory | None = Query(None),  # noqa: B008
    date_from: datetime.date | None = Query(None),  # noqa: B008
    date_to: datetime.date | None = Query(None),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> ExpenseListResponse:
    service = ExpenseService(db)
    return service.list_expenses(
        skip=skip,
        limit=limit,
        search=search,
        category=category,
        date_from=date_from,
        date_to=date_to,
    )


@router.post("", response_model=ExpenseResponse, status_code=201)
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),  # noqa: B008
) -> ExpenseResponse:
    service = ExpenseService(db)
    return service.create_expense(data)


@router.patch("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),  # noqa: B008
) -> ExpenseResponse:
    service = ExpenseService(db)
    return service.update_expense(expense_id, data)


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),  # noqa: B008
) -> None:
    service = ExpenseService(db)
    service.delete_expense(expense_id)

import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.expense import ExpenseCategory
from app.repositories.expense import ExpenseRepository
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseListResponse,
    ExpenseResponse,
    ExpenseSummary,
    ExpenseUpdate,
)


class ExpenseService:
    def __init__(self, db: Session) -> None:
        self.repo = ExpenseRepository(db)

    def list_expenses(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        category: ExpenseCategory | None = None,
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ) -> ExpenseListResponse:
        expenses, total = self.repo.get_all(
            skip=skip,
            limit=limit,
            category=category,
            date_from=date_from,
            date_to=date_to,
        )
        return ExpenseListResponse(
            items=[ExpenseResponse.model_validate(e) for e in expenses],
            total=total,
        )

    def create_expense(
        self,
        data: ExpenseCreate,
        employee_salary_id: int | None = None,
    ) -> ExpenseResponse:
        expense = self.repo.create(data, employee_salary_id=employee_salary_id)
        return ExpenseResponse.model_validate(expense)

    def update_expense(self, expense_id: int, data: ExpenseUpdate) -> ExpenseResponse:
        expense = self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found"
            )
        updated = self.repo.update(expense, data)
        return ExpenseResponse.model_validate(updated)

    def delete_expense(self, expense_id: int) -> None:
        expense = self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found"
            )
        self.repo.delete(expense)

    def get_summary(
        self,
        *,
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ) -> ExpenseSummary:
        total, by_category = self.repo.get_summary(date_from=date_from, date_to=date_to)
        salary_total = by_category.get(ExpenseCategory.salary.value, 0.0)
        operating_total = total - salary_total
        period_label = "Custom Period" if (date_from or date_to) else "All Time"
        return ExpenseSummary(
            total_amount=total,
            by_category=by_category,
            total_all=total,
            total_salary=salary_total,
            total_operating=operating_total,
            period_label=period_label,
        )

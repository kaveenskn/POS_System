import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.expense import Expense, ExpenseCategory
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


class ExpenseRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, expense_id: int) -> Expense | None:
        return self.db.get(Expense, expense_id)

    def get_all(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        category: ExpenseCategory | None = None,
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ) -> tuple[list[Expense], int]:
        stmt = select(Expense)
        count_stmt = select(func.count()).select_from(Expense)

        if category:
            stmt = stmt.where(Expense.category == category)
            count_stmt = count_stmt.where(Expense.category == category)

        if date_from:
            stmt = stmt.where(Expense.expense_date >= date_from)
            count_stmt = count_stmt.where(Expense.expense_date >= date_from)

        if date_to:
            stmt = stmt.where(Expense.expense_date <= date_to)
            count_stmt = count_stmt.where(Expense.expense_date <= date_to)

        total: int = self.db.execute(count_stmt).scalar_one()
        expenses = list(
            self.db.execute(
                stmt.order_by(Expense.expense_date.desc()).offset(skip).limit(limit)
            )
            .scalars()
            .all()
        )
        return expenses, total

    def create(self, data: ExpenseCreate, employee_salary_id: int | None = None) -> Expense:
        expense = Expense(**data.model_dump(), employee_salary_id=employee_salary_id)
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def update(self, expense: Expense, data: ExpenseUpdate) -> Expense:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(expense, field, value)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def delete(self, expense: Expense) -> None:
        self.db.delete(expense)
        self.db.commit()

    def get_summary(
        self,
        *,
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ) -> tuple[float, dict[str, float]]:
        stmt = select(Expense.category, func.sum(Expense.amount).label("total"))

        if date_from:
            stmt = stmt.where(Expense.expense_date >= date_from)
        if date_to:
            stmt = stmt.where(Expense.expense_date <= date_to)

        stmt = stmt.group_by(Expense.category)
        rows = self.db.execute(stmt).all()

        by_category: dict[str, float] = {}
        grand_total: float = 0.0
        for row in rows:
            cat_val = row.category.value if hasattr(row.category, "value") else str(row.category)
            amount = float(row.total) if row.total is not None else 0.0
            by_category[cat_val] = amount
            grand_total += amount

        return grand_total, by_category

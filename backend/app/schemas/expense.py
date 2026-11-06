import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.expense import ExpenseCategory, ExpensePaymentMethod


class ExpenseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: ExpenseCategory
    amount: float = Field(..., gt=0)
    expense_date: datetime.date
    payment_method: ExpensePaymentMethod
    description: str | None = None


class ExpenseUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    category: ExpenseCategory | None = None
    amount: float | None = Field(None, gt=0)
    expense_date: datetime.date | None = None
    payment_method: ExpensePaymentMethod | None = None
    description: str | None = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: ExpenseCategory
    amount: float
    expense_date: datetime.date
    payment_method: ExpensePaymentMethod
    description: str | None
    employee_salary_id: int | None
    created_at: datetime.datetime
    updated_at: datetime.datetime


class ExpenseListResponse(BaseModel):
    items: list[ExpenseResponse]
    total: int


class ExpenseSummary(BaseModel):
    total_amount: float
    by_category: dict[str, float] = {}
    total_all: float = 0.0
    total_salary: float = 0.0
    total_operating: float = 0.0
    period_label: str = "All Time"

import datetime
import enum

from sqlalchemy import Date, DateTime, Enum, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ExpenseCategory(str, enum.Enum):
    electricity = "electricity"
    water = "water"
    rent = "rent"
    internet = "internet"
    transportation = "transportation"
    maintenance = "maintenance"
    salary = "salary"
    other = "other"


class ExpensePaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"
    bank_transfer = "bank_transfer"


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[ExpenseCategory] = mapped_column(
        Enum(ExpenseCategory, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    expense_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    payment_method: Mapped[ExpensePaymentMethod] = mapped_column(
        Enum(ExpensePaymentMethod, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    employee_salary_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, index=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

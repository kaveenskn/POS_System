import datetime

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.employee_enums import SalaryStatus


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    monthly_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Integer, nullable=False, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    salary_records: Mapped[list["EmployeeSalary"]] = relationship(
        "EmployeeSalary", back_populates="employee"
    )


class EmployeeSalary(Base):
    __tablename__ = "employee_salaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employees.id"), nullable=False, index=True
    )
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    base_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    advance_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    net_paid: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    payment_date: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    status: Mapped[SalaryStatus] = mapped_column(
        Enum(SalaryStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=SalaryStatus.pending,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    employee: Mapped["Employee"] = relationship("Employee", back_populates="salary_records")

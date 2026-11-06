import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.employee_enums import SalaryStatus
from app.models.expense import ExpenseCategory, ExpensePaymentMethod
from app.repositories.employee import EmployeeRepository
from app.repositories.expense import ExpenseRepository
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeListResponse,
    EmployeeResponse,
    EmployeeUpdate,
    SalaryRecordCreate,
    SalaryRecordResponse,
    SalaryRecordUpdate,
)
from app.schemas.expense import ExpenseCreate


class EmployeeService:
    def __init__(self, db: Session) -> None:
        self.repo = EmployeeRepository(db)
        self.expense_repo = ExpenseRepository(db)

    def list_employees(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        active_only: bool = False,
    ) -> EmployeeListResponse:
        employees, total = self.repo.get_all(skip=skip, limit=limit, active_only=active_only)
        return EmployeeListResponse(
            items=[EmployeeResponse.model_validate(e) for e in employees],
            total=total,
        )

    def get_employee(self, employee_id: int) -> EmployeeResponse:
        employee = self.repo.get_by_id(employee_id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
            )
        return EmployeeResponse.model_validate(employee)

    def create_employee(self, data: EmployeeCreate) -> EmployeeResponse:
        employee = self.repo.create(data)
        return EmployeeResponse.model_validate(employee)

    def update_employee(self, employee_id: int, data: EmployeeUpdate) -> EmployeeResponse:
        employee = self.repo.get_by_id(employee_id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
            )
        updated = self.repo.update(employee, data)
        return EmployeeResponse.model_validate(updated)

    # --- Salary ---

    def list_salaries(self, employee_id: int) -> list[SalaryRecordResponse]:
        employee = self.repo.get_by_id(employee_id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
            )
        salaries = self.repo.get_salaries_for_employee(employee_id)
        return [SalaryRecordResponse.model_validate(s) for s in salaries]

    def create_salary(self, employee_id: int, data: SalaryRecordCreate) -> SalaryRecordResponse:
        employee = self.repo.get_by_id(employee_id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
            )
        salary = self.repo.create_salary(employee_id, data)
        return SalaryRecordResponse.model_validate(salary)

    def update_salary(
        self, salary_id: int, data: SalaryRecordUpdate
    ) -> SalaryRecordResponse:
        salary = self.repo.get_salary_by_id(salary_id)
        if not salary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Salary record not found"
            )

        was_pending = salary.status == SalaryStatus.pending
        updated = self.repo.update_salary(salary, data)

        # Auto-create expense when transitioning to paid
        if was_pending and updated.status == SalaryStatus.paid:
            employee = self.repo.get_by_id(updated.employee_id)
            emp_name = employee.name if employee else f"Employee #{updated.employee_id}"
            expense_date = updated.payment_date or datetime.date.today()
            expense_data = ExpenseCreate(
                title=f"Salary - {emp_name} ({updated.month}/{updated.year})",
                category=ExpenseCategory.salary,
                amount=float(updated.net_paid),
                expense_date=expense_date,
                payment_method=ExpensePaymentMethod.bank_transfer,
                description=f"Salary payment for {emp_name}, month {updated.month}/{updated.year}",
            )
            self.expense_repo.create(expense_data, employee_salary_id=updated.id)

        return SalaryRecordResponse.model_validate(updated)

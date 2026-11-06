from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.employee import Employee, EmployeeSalary
from app.models.employee_enums import SalaryStatus
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    SalaryRecordCreate,
    SalaryRecordUpdate,
)


class EmployeeRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, employee_id: int) -> Employee | None:
        return self.db.get(Employee, employee_id)

    def get_all(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        active_only: bool = False,
    ) -> tuple[list[Employee], int]:
        stmt = select(Employee)
        count_stmt = select(func.count()).select_from(Employee)

        if active_only:
            stmt = stmt.where(Employee.is_active == True)  # noqa: E712
            count_stmt = count_stmt.where(Employee.is_active == True)  # noqa: E712

        total: int = self.db.execute(count_stmt).scalar_one()
        employees = list(
            self.db.execute(
                stmt.order_by(Employee.created_at.desc()).offset(skip).limit(limit)
            )
            .scalars()
            .all()
        )
        return employees, total

    def create(self, data: EmployeeCreate) -> Employee:
        employee = Employee(**data.model_dump())
        self.db.add(employee)
        self.db.commit()
        self.db.refresh(employee)
        return employee

    def update(self, employee: Employee, data: EmployeeUpdate) -> Employee:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(employee, field, value)
        self.db.commit()
        self.db.refresh(employee)
        return employee

    # --- Salary records ---

    def get_salary_by_id(self, salary_id: int) -> EmployeeSalary | None:
        return self.db.get(EmployeeSalary, salary_id)

    def get_salaries_for_employee(self, employee_id: int) -> list[EmployeeSalary]:
        stmt = (
            select(EmployeeSalary)
            .where(EmployeeSalary.employee_id == employee_id)
            .order_by(EmployeeSalary.year.desc(), EmployeeSalary.month.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def create_salary(
        self, employee_id: int, data: SalaryRecordCreate
    ) -> EmployeeSalary:
        net_paid = data.base_salary - data.advance_amount
        salary = EmployeeSalary(
            employee_id=employee_id,
            month=data.month,
            year=data.year,
            base_salary=data.base_salary,
            advance_amount=data.advance_amount,
            net_paid=net_paid,
            status=SalaryStatus.pending,
            notes=data.notes,
        )
        self.db.add(salary)
        self.db.commit()
        self.db.refresh(salary)
        return salary

    def update_salary(self, salary: EmployeeSalary, data: SalaryRecordUpdate) -> EmployeeSalary:
        update_data = data.model_dump(exclude_unset=True)
        if "advance_amount" in update_data:
            # Recalculate net_paid
            salary.advance_amount = update_data.pop("advance_amount")
            salary.net_paid = float(salary.base_salary) - float(salary.advance_amount)
        for field, value in update_data.items():
            setattr(salary, field, value)
        self.db.commit()
        self.db.refresh(salary)
        return salary

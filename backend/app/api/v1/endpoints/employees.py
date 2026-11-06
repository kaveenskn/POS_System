from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeListResponse,
    EmployeeResponse,
    EmployeeUpdate,
    SalaryRecordCreate,
    SalaryRecordResponse,
    SalaryRecordUpdate,
)
from app.services.employee import EmployeeService

router = APIRouter()


@router.get("", response_model=EmployeeListResponse)
def list_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),  # noqa: B008
) -> EmployeeListResponse:
    service = EmployeeService(db)
    return service.list_employees(skip=skip, limit=limit, active_only=active_only)


@router.post("", response_model=EmployeeResponse, status_code=201)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),  # noqa: B008
) -> EmployeeResponse:
    service = EmployeeService(db)
    return service.create_employee(data)


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),  # noqa: B008
) -> EmployeeResponse:
    service = EmployeeService(db)
    return service.update_employee(employee_id, data)


@router.get("/{employee_id}/salaries", response_model=list[SalaryRecordResponse])
def list_salaries(
    employee_id: int,
    db: Session = Depends(get_db),  # noqa: B008
) -> list[SalaryRecordResponse]:
    service = EmployeeService(db)
    return service.list_salaries(employee_id)


@router.post("/{employee_id}/salaries", response_model=SalaryRecordResponse, status_code=201)
def create_salary(
    employee_id: int,
    data: SalaryRecordCreate,
    db: Session = Depends(get_db),  # noqa: B008
) -> SalaryRecordResponse:
    service = EmployeeService(db)
    return service.create_salary(employee_id, data)


@router.patch("/salaries/{salary_id}", response_model=SalaryRecordResponse)
def update_salary(
    salary_id: int,
    data: SalaryRecordUpdate,
    db: Session = Depends(get_db),  # noqa: B008
) -> SalaryRecordResponse:
    service = EmployeeService(db)
    return service.update_salary(salary_id, data)

import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.employee_enums import SalaryStatus


class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=50)
    role: str = Field(..., min_length=1, max_length=255)
    monthly_salary: float = Field(..., gt=0)


class EmployeeUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=50)
    role: str | None = Field(None, min_length=1, max_length=255)
    monthly_salary: float | None = Field(None, gt=0)
    is_active: bool | None = None


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str | None
    role: str
    monthly_salary: float
    is_active: bool
    created_at: datetime.datetime


class EmployeeListResponse(BaseModel):
    items: list[EmployeeResponse]
    total: int


class SalaryRecordCreate(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000)
    base_salary: float = Field(..., gt=0)
    advance_amount: float = Field(0.0, ge=0)
    notes: str | None = None


class SalaryRecordUpdate(BaseModel):
    status: SalaryStatus | None = None
    payment_date: datetime.date | None = None
    advance_amount: float | None = Field(None, ge=0)
    notes: str | None = None


class SalaryRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    month: int
    year: int
    base_salary: float
    advance_amount: float
    net_paid: float
    payment_date: datetime.date | None
    status: SalaryStatus
    notes: str | None
    created_at: datetime.datetime

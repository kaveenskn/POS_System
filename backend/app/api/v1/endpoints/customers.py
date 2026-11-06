from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.customer import CustomerRepository
from app.schemas.customer import CustomerCreate, CustomerListResponse, CustomerResponse

router = APIRouter()


@router.get("", response_model=CustomerListResponse)
def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    db: Session = Depends(get_db),  # noqa: B008
) -> CustomerListResponse:
    repo = CustomerRepository(db)
    customers, total = repo.get_all(skip=skip, limit=limit, search=search)
    return CustomerListResponse(
        items=[CustomerResponse.model_validate(c) for c in customers],
        total=total,
    )


@router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),  # noqa: B008
) -> CustomerResponse:
    repo = CustomerRepository(db)
    customer = repo.create(data)
    return CustomerResponse.model_validate(customer)

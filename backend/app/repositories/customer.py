from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate


class CustomerRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, customer_id: int) -> Customer | None:
        return self.db.get(Customer, customer_id)

    def get_all(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
    ) -> tuple[list[Customer], int]:
        stmt = select(Customer)
        count_stmt = select(func.count()).select_from(Customer)

        if search:
            pattern = f"%{search}%"
            search_filter = (
                Customer.name.ilike(pattern)
                | Customer.phone.ilike(pattern)
                | Customer.company_name.ilike(pattern)
                | Customer.email.ilike(pattern)
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        total: int = self.db.execute(count_stmt).scalar_one()
        customers = list(
            self.db.execute(
                stmt.order_by(Customer.created_at.desc()).offset(skip).limit(limit)
            )
            .scalars()
            .all()
        )
        return customers, total

    def create(self, data: CustomerCreate) -> Customer:
        customer = Customer(**data.model_dump())
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(customer)
        return customer

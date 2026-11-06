import datetime

from sqlalchemy import Date, cast, func, select
from sqlalchemy.orm import Session, selectinload

from app.models.invoice import Invoice, InvoiceItem


class InvoiceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, invoice_id: int) -> Invoice | None:
        stmt = (
            select(Invoice)
            .options(selectinload(Invoice.items))
            .where(Invoice.id == invoice_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_daily_count(self, date: datetime.date) -> int:
        stmt = select(func.count()).select_from(Invoice).where(
            cast(Invoice.created_at, Date) == date
        )
        return self.db.execute(stmt).scalar_one()

    def get_all(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ) -> tuple[list[Invoice], int]:
        stmt = select(Invoice).options(selectinload(Invoice.items))
        count_stmt = select(func.count()).select_from(Invoice)

        if search:
            pattern = f"%{search}%"
            search_filter = Invoice.invoice_number.ilike(pattern)
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        if date_from:
            stmt = stmt.where(cast(Invoice.created_at, Date) >= date_from)
            count_stmt = count_stmt.where(cast(Invoice.created_at, Date) >= date_from)

        if date_to:
            stmt = stmt.where(cast(Invoice.created_at, Date) <= date_to)
            count_stmt = count_stmt.where(cast(Invoice.created_at, Date) <= date_to)

        total: int = self.db.execute(count_stmt).scalar_one()
        invoices = list(
            self.db.execute(
                stmt.order_by(Invoice.created_at.desc()).offset(skip).limit(limit)
            )
            .scalars()
            .all()
        )
        return invoices, total

    def create(self, invoice: Invoice, items: list[InvoiceItem]) -> Invoice:
        self.db.add(invoice)
        self.db.flush()
        for item in items:
            item.invoice_id = invoice.id
            self.db.add(item)
        self.db.commit()
        self.db.refresh(invoice)
        # Reload with items
        stmt = (
            select(Invoice)
            .options(selectinload(Invoice.items))
            .where(Invoice.id == invoice.id)
        )
        result = self.db.execute(stmt).scalar_one()
        return result

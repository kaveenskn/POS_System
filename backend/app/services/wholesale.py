import datetime
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy import Date, cast, func, select
from sqlalchemy.orm import Session, selectinload

from app.models.customer import Customer
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
from app.models.product import Product, StockMovement
from app.repositories.invoice import InvoiceRepository
from app.schemas.invoice import InvoiceListResponse, InvoiceResponse
from app.schemas.wholesale import (
    WholesaleClientCreate,
    WholesaleClientListResponse,
    WholesaleClientResponse,
    WholesaleClientUpdate,
    WholesaleOrderCreate,
    WholesaleStatsResponse,
)


class WholesaleService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.invoice_repo = InvoiceRepository(db)

    def _generate_order_number(self, today: datetime.date) -> str:
        daily_count = self.invoice_repo.get_daily_count(today)
        sequence = daily_count + 1
        date_str = today.strftime("%Y%m%d")
        return f"WHL-{date_str}-{sequence:04d}"

    def get_clients(
        self,
        *,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> WholesaleClientListResponse:
        stmt = select(Customer)
        count_stmt = select(func.count()).select_from(Customer)

        if search and search.trim():
            pattern = f"%{search.strip()}%"
            search_filter = (
                Customer.name.ilike(pattern)
                | Customer.phone.ilike(pattern)
                | Customer.company_name.ilike(pattern)
                | Customer.email.ilike(pattern)
                | Customer.address.ilike(pattern)
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

        # Compute order counts and spent per customer
        client_ids = [c.id for c in customers]
        stats_map: dict[int, tuple[int, float]] = {}
        if client_ids:
            stats_stmt = (
                select(
                    Invoice.customer_id,
                    func.count(Invoice.id),
                    func.sum(Invoice.total_amount),
                )
                .where(Invoice.customer_id.in_(client_ids))
                .group_by(Invoice.customer_id)
            )
            for row in self.db.execute(stats_stmt).all():
                cid, ord_count, spent = row
                stats_map[cid] = (int(ord_count or 0), float(spent or 0.0))

        items: list[WholesaleClientResponse] = []
        for c in customers:
            ord_count, spent = stats_map.get(c.id, (0, 0.0))
            items.append(
                WholesaleClientResponse(
                    id=c.id,
                    name=c.name,
                    company_name=c.company_name,
                    phone=c.phone,
                    email=c.email,
                    address=c.address,
                    created_at=c.created_at,
                    total_orders=ord_count,
                    total_spent=spent,
                )
            )

        return WholesaleClientListResponse(items=items, total=total)

    def create_client(self, data: WholesaleClientCreate) -> WholesaleClientResponse:
        customer = Customer(
            name=data.name.strip(),
            company_name=data.company_name.strip() if data.company_name else None,
            phone=data.phone.strip(),
            email=data.email.strip() if data.email else None,
            address=data.address.strip() if data.address else None,
        )
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(customer)
        return WholesaleClientResponse(
            id=customer.id,
            name=customer.name,
            company_name=customer.company_name,
            phone=customer.phone,
            email=customer.email,
            address=customer.address,
            created_at=customer.created_at,
            total_orders=0,
            total_spent=0.0,
        )

    def get_client(self, client_id: int) -> WholesaleClientResponse:
        customer = self.db.get(Customer, client_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Wholesale client with id {client_id} not found",
            )
        stats_stmt = (
            select(
                func.count(Invoice.id),
                func.sum(Invoice.total_amount),
            ).where(Invoice.customer_id == client_id)
        )
        row = self.db.execute(stats_stmt).first()
        ord_count = int(row[0] or 0) if row else 0
        spent = float(row[1] or 0.0) if row else 0.0

        return WholesaleClientResponse(
            id=customer.id,
            name=customer.name,
            company_name=customer.company_name,
            phone=customer.phone,
            email=customer.email,
            address=customer.address,
            created_at=customer.created_at,
            total_orders=ord_count,
            total_spent=spent,
        )

    def update_client(self, client_id: int, data: WholesaleClientUpdate) -> WholesaleClientResponse:
        customer = self.db.get(Customer, client_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Wholesale client with id {client_id} not found",
            )
        if data.name is not None:
            customer.name = data.name.strip()
        if data.company_name is not None:
            customer.company_name = data.company_name.strip() or None
        if data.phone is not None:
            customer.phone = data.phone.strip()
        if data.email is not None:
            customer.email = data.email.strip() or None
        if data.address is not None:
            customer.address = data.address.strip() or None

        self.db.commit()
        self.db.refresh(customer)
        return self.get_client(customer.id)

    def get_orders(
        self,
        *,
        search: str | None = None,
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> InvoiceListResponse:
        stmt = (
            select(Invoice)
            .options(selectinload(Invoice.items), selectinload(Invoice.customer))
            .where(Invoice.customer_id.isnot(None))
        )
        count_stmt = (
            select(func.count())
            .select_from(Invoice)
            .where(Invoice.customer_id.isnot(None))
        )

        if search and search.strip():
            pattern = f"%{search.strip()}%"
            search_filter = Invoice.invoice_number.ilike(pattern) | Invoice.notes.ilike(pattern)
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

        return InvoiceListResponse(
            items=[InvoiceResponse.model_validate(inv) for inv in invoices],
            total=total,
        )

    def create_order(self, data: WholesaleOrderCreate) -> InvoiceResponse:
        customer = self.db.get(Customer, data.customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Wholesale customer with id {data.customer_id} does not exist",
            )

        today = datetime.date.today()
        order_number = self._generate_order_number(today)

        invoice_items: list[InvoiceItem] = []
        subtotal = 0.0

        for item_in in data.items:
            product = self.db.get(Product, item_in.product_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product id={item_in.product_id} not found in inventory catalog",
                )
            if product.quantity < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=(
                        f"Insufficient stock for '{product.name}': "
                        f"available={product.quantity}, requested={item_in.quantity}"
                    ),
                )

            if item_in.unit_price is not None:
                unit_price = float(item_in.unit_price)
            elif product.wholesale_price is not None:
                unit_price = float(product.wholesale_price)
            else:
                unit_price = float(product.selling_price)

            cost_price = float(product.cost_price)
            line_total = unit_price * item_in.quantity
            subtotal += line_total

            invoice_items.append(
                InvoiceItem(
                    product_id=product.id,
                    product_name=product.name,
                    product_code=product.code,
                    unit_price=unit_price,
                    cost_price=cost_price,
                    quantity=item_in.quantity,
                    line_total=line_total,
                )
            )

        discount = float(data.discount_amount)
        total_amount = max(subtotal - discount, 0.0)
        change_amount = float(data.amount_paid) - total_amount

        invoice = Invoice(
            invoice_number=order_number,
            customer_id=customer.id,
            subtotal=subtotal,
            discount_amount=discount,
            total_amount=total_amount,
            payment_method=data.payment_method,
            amount_paid=float(data.amount_paid),
            change_amount=change_amount,
            status=InvoiceStatus.completed,
            notes=data.notes or f"Wholesale order for {customer.company_name or customer.name}",
        )

        # Deduct warehouse stock and record immutable StockMovement audit
        for item_in in data.items:
            product = self.db.get(Product, item_in.product_id)
            if product:
                prev_qty = product.quantity
                product.quantity -= item_in.quantity
                movement = StockMovement(
                    product_id=product.id,
                    movement_type="WHOLESALE",
                    previous_quantity=prev_qty,
                    adjustment_quantity=-item_in.quantity,
                    new_quantity=product.quantity,
                    reason=f"Wholesale Order {order_number}",
                    notes=f"Dispatched {item_in.quantity} units to {customer.company_name or customer.name}",
                    user_name="Admin",
                )
                self.db.add(movement)

        saved_invoice = self.invoice_repo.create(invoice, invoice_items)
        return InvoiceResponse.model_validate(saved_invoice)

    def get_stats(self) -> WholesaleStatsResponse:
        client_count_stmt = select(func.count(Customer.id))
        client_count = int(self.db.execute(client_count_stmt).scalar_one() or 0)

        orders_stmt = select(
            func.count(Invoice.id),
            func.sum(Invoice.total_amount),
        ).where(Invoice.customer_id.isnot(None))

        row = self.db.execute(orders_stmt).first()
        total_orders = int(row[0] or 0) if row else 0
        total_revenue = float(row[1] or 0.0) if row else 0.0
        avg_order = (total_revenue / total_orders) if total_orders > 0 else 0.0

        return WholesaleStatsResponse(
            client_count=client_count,
            total_orders=total_orders,
            total_revenue=total_revenue,
            avg_order_value=avg_order,
        )


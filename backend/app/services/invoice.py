import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
from app.models.product import Product, StockMovement
from app.repositories.invoice import InvoiceRepository
from app.schemas.invoice import InvoiceCreate, InvoiceListResponse, InvoiceResponse


class InvoiceService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = InvoiceRepository(db)

    def _generate_invoice_number(self, today: datetime.date) -> str:
        daily_count = self.repo.get_daily_count(today)
        sequence = daily_count + 1
        date_str = today.strftime("%Y%m%d")
        return f"INV-{date_str}-{sequence:04d}"

    def create_invoice(self, data: InvoiceCreate) -> InvoiceResponse:
        today = datetime.date.today()
        invoice_number = self._generate_invoice_number(today)

        # Validate products and check stock
        invoice_items: list[InvoiceItem] = []
        subtotal = 0.0
        total_item_discounts = 0.0

        for item_in in data.items:
            product: Product | None = self.db.get(Product, item_in.product_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product id={item_in.product_id} not found",
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
            elif product.wholesale_price is not None and data.customer_id is not None:
                unit_price = float(product.wholesale_price)
            else:
                unit_price = float(product.selling_price)

            cost_price = float(product.cost_price)
            gross_line = unit_price * item_in.quantity
            item_discount = float(item_in.discount_amount or 0.0)
            item_discount = max(0.0, min(item_discount, gross_line))
            line_total = max(gross_line - item_discount, 0.0)

            subtotal += gross_line
            total_item_discounts += item_discount

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

        bill_discount = float(data.discount_amount)
        subtotal_after_items = max(subtotal - total_item_discounts, 0.0)
        bill_discount = max(0.0, min(bill_discount, subtotal_after_items))
        total_discount = total_item_discounts + bill_discount

        total_amount = max(subtotal - total_discount, 0.0)
        change_amount = float(data.amount_paid) - total_amount

        invoice = Invoice(
            invoice_number=invoice_number,
            customer_id=data.customer_id,
            subtotal=subtotal,
            discount_amount=total_discount,
            total_amount=total_amount,
            payment_method=data.payment_method,
            amount_paid=float(data.amount_paid),
            change_amount=change_amount,
            status=InvoiceStatus.completed,
            notes=data.notes,
        )

        # Deduct stock and record audit movement
        for item_in in data.items:
            product = self.db.get(Product, item_in.product_id)
            if product:
                prev_qty = product.quantity
                product.quantity -= item_in.quantity
                movement = StockMovement(
                    product_id=product.id,
                    movement_type="SALE",
                    previous_quantity=prev_qty,
                    adjustment_quantity=-item_in.quantity,
                    new_quantity=product.quantity,
                    reason=f"POS Sale Invoice {invoice_number}",
                    notes=f"Sold {item_in.quantity} units via POS billing",
                    user_name="Admin",
                )
                self.db.add(movement)

        # Assign invoice reference to items
        saved_invoice = self.repo.create(invoice, invoice_items)
        return InvoiceResponse.model_validate(saved_invoice)

    def list_invoices(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ) -> InvoiceListResponse:
        invoices, total = self.repo.get_all(
            skip=skip,
            limit=limit,
            search=search,
            date_from=date_from,
            date_to=date_to,
        )
        return InvoiceListResponse(
            items=[InvoiceResponse.model_validate(inv) for inv in invoices],
            total=total,
        )

    def get_invoice(self, invoice_id: int) -> InvoiceResponse:
        invoice = self.repo.get_by_id(invoice_id)
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found"
            )
        return InvoiceResponse.model_validate(invoice)

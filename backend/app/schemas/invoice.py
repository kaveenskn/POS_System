import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.invoice import InvoiceStatus, PaymentMethod


class InvoiceItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class InvoiceCreate(BaseModel):
    customer_id: int | None = None
    items: list[InvoiceItemCreate] = Field(..., min_length=1)
    discount_amount: float = Field(0.0, ge=0)
    payment_method: PaymentMethod
    amount_paid: float = Field(..., ge=0)
    notes: str | None = None


class InvoiceItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    product_code: str
    unit_price: float
    cost_price: float
    quantity: int
    line_total: float


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_number: str
    customer_id: int | None
    subtotal: float
    discount_amount: float
    total_amount: float
    payment_method: PaymentMethod
    amount_paid: float
    change_amount: float
    status: InvoiceStatus
    notes: str | None
    created_at: datetime.datetime
    items: list[InvoiceItemResponse]


class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int

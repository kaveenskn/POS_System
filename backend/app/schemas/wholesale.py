import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.invoice import PaymentMethod
from app.schemas.invoice import InvoiceResponse


class WholesaleClientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Contact person or owner name")
    company_name: str | None = Field(None, max_length=255, description="Workshop, garage, or dealership name")
    phone: str = Field(..., min_length=1, max_length=50, description="Contact or WhatsApp phone number")
    email: str | None = Field(None, max_length=255)
    address: str | None = Field(None, max_length=255, description="Workshop location or business address")


class WholesaleClientCreate(WholesaleClientBase):
    pass


class WholesaleClientUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    company_name: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, min_length=1, max_length=50)
    email: str | None = Field(None, max_length=255)
    address: str | None = Field(None, max_length=255)


class WholesaleClientResponse(WholesaleClientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime.datetime
    total_orders: int = 0
    total_spent: float = 0.0


class WholesaleClientListResponse(BaseModel):
    items: list[WholesaleClientResponse]
    total: int


class WholesaleOrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    unit_price: float | None = Field(None, ge=0)


class WholesaleOrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    items: list[WholesaleOrderItemCreate] = Field(..., min_length=1)
    discount_amount: float = Field(0.0, ge=0)
    payment_method: PaymentMethod = PaymentMethod.BANK_TRANSFER
    amount_paid: float = Field(..., ge=0)
    notes: str | None = None


class WholesaleStatsResponse(BaseModel):
    client_count: int
    total_orders: int
    total_revenue: float
    avg_order_value: float


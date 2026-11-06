from datetime import datetime
from pydantic import BaseModel, ConfigDict


# --- SALES REPORT SCHEMAS ---
class SaleItemDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_name: str
    product_code: str
    quantity: int
    unit_price: float
    subtotal: float


class SaleRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    invoice_number: str
    sale_date: datetime
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    payment_method: str
    cashier_name: str
    customer_name: str | None = None
    items_count: int = 0
    items: list[SaleItemDetail] = []


class SalesReportSummary(BaseModel):
    total_sales_amount: float
    number_of_transactions: int
    products_sold_count: int
    total_discounts: float


class SalesReportResponse(BaseModel):
    period: str  # daily, weekly, monthly, yearly, custom
    start_date: datetime
    end_date: datetime
    summary: SalesReportSummary
    sales: list[SaleRecord]


# --- INVENTORY REPORT SCHEMAS ---
class CurrentStockItem(BaseModel):
    product_name: str
    sku: str
    category: str
    current_quantity: int
    purchase_price: float
    selling_price: float
    stock_value: float


class CurrentStockReportResponse(BaseModel):
    total_stock_value: float
    total_items_count: int
    items: list[CurrentStockItem]


class LowStockItem(BaseModel):
    product_name: str
    sku: str
    current_quantity: int
    low_stock_level: int
    stock_status: str


class LowStockReportResponse(BaseModel):
    low_stock_count: int
    items: list[LowStockItem]


class OutOfStockItem(BaseModel):
    product_name: str
    sku: str
    category: str
    brand: str
    last_stock_availability: datetime | str | None = None


class OutOfStockReportResponse(BaseModel):
    out_of_stock_count: int
    items: list[OutOfStockItem]


# --- PURCHASE REPORT SCHEMAS ---
class PurchaseBySupplierItem(BaseModel):
    supplier_name: str
    number_of_purchases: int
    total_purchase_amount: float
    paid_amount: float
    outstanding_amount: float


class PurchaseBySupplierResponse(BaseModel):
    total_purchases_amount: float
    total_outstanding: float
    suppliers: list[PurchaseBySupplierItem]


class PurchaseByProductItem(BaseModel):
    product_name: str
    sku: str
    quantity_purchased: int
    total_purchase_cost: float
    last_purchase_date: datetime | str | None = None


class PurchaseByProductResponse(BaseModel):
    total_cost: float
    total_units_purchased: int
    products: list[PurchaseByProductItem]


class PurchaseHistoryItem(BaseModel):
    id: int
    purchase_number: str
    supplier_name: str
    purchase_date: datetime
    total_amount: float
    payment_status: str


class PurchaseHistoryResponse(BaseModel):
    total_amount: float
    purchases: list[PurchaseHistoryItem]


class SupplierPaymentRecord(BaseModel):
    id: int
    payment_date: datetime
    amount: float
    payment_method: str
    reference_number: str | None = None


class SupplierPaymentItem(BaseModel):
    supplier_name: str
    total_amount: float
    paid_amount: float
    outstanding_balance: float
    payments: list[SupplierPaymentRecord] = []


class SupplierPaymentResponse(BaseModel):
    total_paid: float
    total_outstanding: float
    suppliers: list[SupplierPaymentItem]


# --- OVERVIEW KPI SCHEMAS ---
class ReportOverviewResponse(BaseModel):
    sales_total: float
    transactions_count: int
    stock_value: float
    total_stock_items: int
    low_stock_count: int
    out_of_stock_count: int
    pending_payables: float
    total_paid_suppliers: float


import datetime
from pydantic import BaseModel, ConfigDict


class DashboardSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    today_sales: float = 0.0
    today_invoices_count: int = 0
    yesterday_sales: float = 0.0
    month_sales: float = 0.0
    month_invoices_count: int = 0
    total_revenue: float = 0.0
    total_invoices_count: int = 0
    total_products: int = 0
    total_stock_units: int = 0
    low_stock_count: int = 0
    out_of_stock_count: int = 0
    total_inventory_value: float = 0.0
    total_customers: int = 0


class SalesTrendPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: str
    label: str
    revenue: float
    invoices_count: int


class MonthlyTrendPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    month: str
    label: str
    revenue: float
    invoices_count: int


class TopSellingProduct(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int | None = None
    product_name: str
    product_code: str
    category: str = "Motorcycle Spare Parts"
    units_sold: int
    total_revenue: float
    current_stock: int = 0


class RecentActivity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_number: str
    created_at: datetime.datetime
    customer_name: str | None = None
    total_amount: float
    payment_method: str
    status: str
    items_count: int = 0


class LowStockAlert(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    category: str
    quantity: int
    min_stock_level: int
    unit: str = "Pieces"
    cost_price: float = 0.0
    selling_price: float = 0.0
    is_out_of_stock: bool = False


class CategoryBreakdown(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category: str
    product_count: int
    stock_units: int
    inventory_value: float


class DashboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    summary: DashboardSummary
    sales_trend_days: list[SalesTrendPoint]
    monthly_trend: list[MonthlyTrendPoint]
    top_selling_products: list[TopSellingProduct]
    recent_invoices: list[RecentActivity]
    low_stock_alerts: list[LowStockAlert]
    category_distribution: list[CategoryBreakdown]
    last_updated: datetime.datetime

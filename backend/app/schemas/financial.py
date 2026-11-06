from pydantic import BaseModel


class FinancialSummary(BaseModel):
    today_sales: float
    month_sales: float
    total_revenue: float
    total_cogs: float
    gross_profit: float
    total_expenses: float
    total_salary_expenses: float
    total_operating_expenses: float
    net_profit: float
    invoice_count_today: int = 0
    invoice_count_month: int = 0

import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.expense import Expense, ExpenseCategory
from app.models.invoice import Invoice, InvoiceItem
from app.schemas.financial import FinancialSummary


class FinancialService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_summary(self) -> FinancialSummary:
        today = datetime.date.today()
        month_start = today.replace(day=1)
        today_start = datetime.datetime.combine(today, datetime.time.min)
        month_start_dt = datetime.datetime.combine(month_start, datetime.time.min)

        # Today sales
        today_sales_stmt = select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(
            Invoice.created_at >= today_start
        )
        today_sales: float = float(self.db.execute(today_sales_stmt).scalar_one())

        # Count invoices today
        today_count_stmt = select(func.count(Invoice.id)).where(
            Invoice.created_at >= today_start
        )
        invoice_count_today = int(self.db.execute(today_count_stmt).scalar_one())

        # Month sales
        month_sales_stmt = select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(
            Invoice.created_at >= month_start_dt
        )
        month_sales: float = float(self.db.execute(month_sales_stmt).scalar_one())

        # Count invoices month
        month_count_stmt = select(func.count(Invoice.id)).where(
            Invoice.created_at >= month_start_dt
        )
        invoice_count_month = int(self.db.execute(month_count_stmt).scalar_one())

        # Total revenue (all time)
        total_revenue_stmt = select(func.coalesce(func.sum(Invoice.total_amount), 0))
        total_revenue: float = float(self.db.execute(total_revenue_stmt).scalar_one())

        # Total COGS (cost * qty from all invoice items)
        total_cogs_stmt = select(
            func.coalesce(
                func.sum(InvoiceItem.cost_price * InvoiceItem.quantity), 0
            )
        )
        total_cogs: float = float(self.db.execute(total_cogs_stmt).scalar_one())

        gross_profit = total_revenue - total_cogs

        # Total non-salary operating expenses
        non_salary_stmt = select(
            func.coalesce(func.sum(Expense.amount), 0)
        ).where(Expense.category != ExpenseCategory.salary)
        total_operating_expenses: float = float(self.db.execute(non_salary_stmt).scalar_one())

        # Total salary expenses
        salary_stmt = select(
            func.coalesce(func.sum(Expense.amount), 0)
        ).where(Expense.category == ExpenseCategory.salary)
        total_salary_expenses: float = float(self.db.execute(salary_stmt).scalar_one())

        total_expenses = total_operating_expenses + total_salary_expenses
        net_profit = gross_profit - total_expenses

        return FinancialSummary(
            today_sales=today_sales,
            month_sales=month_sales,
            total_revenue=total_revenue,
            total_cogs=total_cogs,
            gross_profit=gross_profit,
            total_expenses=total_expenses,
            total_salary_expenses=total_salary_expenses,
            total_operating_expenses=total_operating_expenses,
            net_profit=net_profit,
            invoice_count_today=invoice_count_today,
            invoice_count_month=invoice_count_month,
        )

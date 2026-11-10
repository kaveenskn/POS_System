import datetime
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.customer import Customer
from app.models.invoice import Invoice, InvoiceItem
from app.models.product import Product
from app.models.report import Sale, SaleItem
from app.schemas.dashboard import (
    CategoryBreakdown,
    DashboardResponse,
    DashboardSummary,
    LowStockAlert,
    MonthlyTrendPoint,
    RecentActivity,
    SalesTrendPoint,
    TopSellingProduct,
)


class DashboardRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_dashboard_metrics(self) -> DashboardResponse:
        now = datetime.datetime.now(datetime.timezone.utc)
        today = now.date()
        today_start = datetime.datetime.combine(today, datetime.time.min, tzinfo=datetime.timezone.utc)
        today_end = datetime.datetime.combine(today, datetime.time.max, tzinfo=datetime.timezone.utc)

        yesterday = today - datetime.timedelta(days=1)
        yesterday_start = datetime.datetime.combine(yesterday, datetime.time.min, tzinfo=datetime.timezone.utc)
        yesterday_end = datetime.datetime.combine(yesterday, datetime.time.max, tzinfo=datetime.timezone.utc)

        month_start_date = today.replace(day=1)
        month_start = datetime.datetime.combine(month_start_date, datetime.time.min, tzinfo=datetime.timezone.utc)

        # ---------------------------------------------------------------------
        # 1. SALES & REVENUE (Invoices & Sales support)
        # ---------------------------------------------------------------------
        # Check Invoices
        inv_total_stmt = select(
            func.coalesce(func.sum(Invoice.total_amount), 0.0),
            func.count(Invoice.id),
        )
        inv_revenue, inv_count = self.db.execute(inv_total_stmt).one()
        inv_revenue = float(inv_revenue or 0.0)
        inv_count = int(inv_count or 0)

        # Check Sales (from reports module / seed if any)
        sale_total_stmt = select(
            func.coalesce(func.sum(Sale.total_amount), 0.0),
            func.count(Sale.id),
        )
        sale_revenue, sale_count = self.db.execute(sale_total_stmt).one()
        sale_revenue = float(sale_revenue or 0.0)
        sale_count = int(sale_count or 0)

        total_revenue = inv_revenue if inv_count > 0 else sale_revenue
        total_invoices_count = inv_count if inv_count > 0 else sale_count

        # Today's sales
        if inv_count > 0:
            today_stmt = select(
                func.coalesce(func.sum(Invoice.total_amount), 0.0),
                func.count(Invoice.id),
            ).where(Invoice.created_at >= today_start, Invoice.created_at <= today_end)
            today_sales, today_invoices_count = self.db.execute(today_stmt).one()
        else:
            today_stmt = select(
                func.coalesce(func.sum(Sale.total_amount), 0.0),
                func.count(Sale.id),
            ).where(Sale.sale_date >= today_start, Sale.sale_date <= today_end)
            today_sales, today_invoices_count = self.db.execute(today_stmt).one()
        today_sales = float(today_sales or 0.0)
        today_invoices_count = int(today_invoices_count or 0)

        # Yesterday's sales
        if inv_count > 0:
            yesterday_stmt = select(
                func.coalesce(func.sum(Invoice.total_amount), 0.0),
            ).where(Invoice.created_at >= yesterday_start, Invoice.created_at <= yesterday_end)
            yesterday_sales = float(self.db.execute(yesterday_stmt).scalar_one() or 0.0)
        else:
            yesterday_stmt = select(
                func.coalesce(func.sum(Sale.total_amount), 0.0),
            ).where(Sale.sale_date >= yesterday_start, Sale.sale_date <= yesterday_end)
            yesterday_sales = float(self.db.execute(yesterday_stmt).scalar_one() or 0.0)

        # Month's sales
        if inv_count > 0:
            month_stmt = select(
                func.coalesce(func.sum(Invoice.total_amount), 0.0),
                func.count(Invoice.id),
            ).where(Invoice.created_at >= month_start)
            month_sales, month_invoices_count = self.db.execute(month_stmt).one()
        else:
            month_stmt = select(
                func.coalesce(func.sum(Sale.total_amount), 0.0),
                func.count(Sale.id),
            ).where(Sale.sale_date >= month_start)
            month_sales, month_invoices_count = self.db.execute(month_stmt).one()
        month_sales = float(month_sales or 0.0)
        month_invoices_count = int(month_invoices_count or 0)

        # ---------------------------------------------------------------------
        # 2. PRODUCT & INVENTORY METRICS
        # ---------------------------------------------------------------------
        total_products_stmt = select(func.count(Product.id)).where(Product.status == "active")
        total_products = int(self.db.execute(total_products_stmt).scalar_one() or 0)

        total_stock_stmt = select(func.coalesce(func.sum(Product.quantity), 0)).where(Product.status == "active")
        total_stock_units = int(self.db.execute(total_stock_stmt).scalar_one() or 0)

        low_stock_stmt = select(func.count(Product.id)).where(
            Product.status == "active",
            Product.quantity > 0,
            Product.quantity <= Product.min_stock_level,
        )
        low_stock_count = int(self.db.execute(low_stock_stmt).scalar_one() or 0)

        out_of_stock_stmt = select(func.count(Product.id)).where(
            Product.status == "active",
            Product.quantity <= 0,
        )
        out_of_stock_count = int(self.db.execute(out_of_stock_stmt).scalar_one() or 0)

        inv_value_stmt = select(
            func.coalesce(func.sum(Product.quantity * Product.cost_price), 0.0)
        ).where(Product.status == "active")
        total_inventory_value = round(float(self.db.execute(inv_value_stmt).scalar_one() or 0.0), 2)

        # Customer count
        customer_count_stmt = select(func.count(Customer.id))
        try:
            total_customers = int(self.db.execute(customer_count_stmt).scalar_one() or 0)
        except Exception:
            total_customers = 0

        summary = DashboardSummary(
            today_sales=round(today_sales, 2),
            today_invoices_count=today_invoices_count,
            yesterday_sales=round(yesterday_sales, 2),
            month_sales=round(month_sales, 2),
            month_invoices_count=month_invoices_count,
            total_revenue=round(total_revenue, 2),
            total_invoices_count=total_invoices_count,
            total_products=total_products,
            total_stock_units=total_stock_units,
            low_stock_count=low_stock_count,
            out_of_stock_count=out_of_stock_count,
            total_inventory_value=total_inventory_value,
            total_customers=total_customers,
        )

        # ---------------------------------------------------------------------
        # 3. SALES TREND (Last 7 Days)
        # ---------------------------------------------------------------------
        sales_trend_days: list[SalesTrendPoint] = []
        for i in range(6, -1, -1):
            day_date = today - datetime.timedelta(days=i)
            d_start = datetime.datetime.combine(day_date, datetime.time.min, tzinfo=datetime.timezone.utc)
            d_end = datetime.datetime.combine(day_date, datetime.time.max, tzinfo=datetime.timezone.utc)

            if inv_count > 0:
                day_stmt = select(
                    func.coalesce(func.sum(Invoice.total_amount), 0.0),
                    func.count(Invoice.id),
                ).where(Invoice.created_at >= d_start, Invoice.created_at <= d_end)
                d_rev, d_cnt = self.db.execute(day_stmt).one()
            else:
                day_stmt = select(
                    func.coalesce(func.sum(Sale.total_amount), 0.0),
                    func.count(Sale.id),
                ).where(Sale.sale_date >= d_start, Sale.sale_date <= d_end)
                d_rev, d_cnt = self.db.execute(day_stmt).one()

            sales_trend_days.append(
                SalesTrendPoint(
                    date=day_date.isoformat(),
                    label=day_date.strftime("%a (%b %d)"),
                    revenue=round(float(d_rev or 0.0), 2),
                    invoices_count=int(d_cnt or 0),
                )
            )

        # ---------------------------------------------------------------------
        # 4. MONTHLY TREND (Last 6 Months)
        # ---------------------------------------------------------------------
        monthly_trend: list[MonthlyTrendPoint] = []
        # Calculate start dates for past 6 months
        year = today.year
        month = today.month
        months_list = []
        for _ in range(6):
            months_list.append((year, month))
            month -= 1
            if month == 0:
                month = 12
                year -= 1
        months_list.reverse()

        for yr, mo in months_list:
            m_start = datetime.datetime(yr, mo, 1, 0, 0, 0, tzinfo=datetime.timezone.utc)
            if mo == 12:
                next_m_start = datetime.datetime(yr + 1, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc)
            else:
                next_m_start = datetime.datetime(yr, mo + 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc)

            if inv_count > 0:
                m_stmt = select(
                    func.coalesce(func.sum(Invoice.total_amount), 0.0),
                    func.count(Invoice.id),
                ).where(Invoice.created_at >= m_start, Invoice.created_at < next_m_start)
                m_rev, m_cnt = self.db.execute(m_stmt).one()
            else:
                m_stmt = select(
                    func.coalesce(func.sum(Sale.total_amount), 0.0),
                    func.count(Sale.id),
                ).where(Sale.sale_date >= m_start, Sale.sale_date < next_m_start)
                m_rev, m_cnt = self.db.execute(m_stmt).one()

            monthly_trend.append(
                MonthlyTrendPoint(
                    month=f"{yr:04d}-{mo:02d}",
                    label=m_start.strftime("%b %Y"),
                    revenue=round(float(m_rev or 0.0), 2),
                    invoices_count=int(m_cnt or 0),
                )
            )

        # ---------------------------------------------------------------------
        # 5. TOP SELLING PRODUCTS
        # ---------------------------------------------------------------------
        top_selling_products: list[TopSellingProduct] = []
        # Try from InvoiceItem first
        top_inv_items_stmt = (
            select(
                InvoiceItem.product_name,
                InvoiceItem.product_code,
                func.sum(InvoiceItem.quantity).label("total_qty"),
                func.sum(InvoiceItem.line_total).label("total_rev"),
                func.max(InvoiceItem.product_id).label("prod_id"),
            )
            .group_by(InvoiceItem.product_name, InvoiceItem.product_code)
            .order_by(func.sum(InvoiceItem.quantity).desc())
            .limit(5)
        )
        inv_item_rows = list(self.db.execute(top_inv_items_stmt).all())

        if inv_item_rows:
            for r in inv_item_rows:
                prod = None
                if r.prod_id:
                    prod = self.db.get(Product, r.prod_id)
                top_selling_products.append(
                    TopSellingProduct(
                        product_id=r.prod_id,
                        product_name=r.product_name,
                        product_code=r.product_code,
                        category=prod.category if prod else "Motorcycle Spare Parts",
                        units_sold=int(r.total_qty or 0),
                        total_revenue=round(float(r.total_rev or 0.0), 2),
                        current_stock=int(prod.quantity if prod else 0),
                    )
                )
        else:
            # Fallback to SaleItem if present
            top_sale_items_stmt = (
                select(
                    SaleItem.product_name,
                    SaleItem.product_code,
                    func.sum(SaleItem.quantity).label("total_qty"),
                    func.sum(SaleItem.subtotal).label("total_rev"),
                    func.max(SaleItem.product_id).label("prod_id"),
                )
                .group_by(SaleItem.product_name, SaleItem.product_code)
                .order_by(func.sum(SaleItem.quantity).desc())
                .limit(5)
            )
            sale_item_rows = list(self.db.execute(top_sale_items_stmt).all())
            for r in sale_item_rows:
                prod = None
                if r.prod_id:
                    prod = self.db.get(Product, r.prod_id)
                top_selling_products.append(
                    TopSellingProduct(
                        product_id=r.prod_id,
                        product_name=r.product_name,
                        product_code=r.product_code,
                        category=prod.category if prod else "Motorcycle Spare Parts",
                        units_sold=int(r.total_qty or 0),
                        total_revenue=round(float(r.total_rev or 0.0), 2),
                        current_stock=int(prod.quantity if prod else 0),
                    )
                )

        # ---------------------------------------------------------------------
        # 6. RECENT TRANSACTIONS / INVOICES
        # ---------------------------------------------------------------------
        recent_invoices: list[RecentActivity] = []
        if inv_count > 0:
            inv_recent_stmt = (
                select(Invoice)
                .options(selectinload(Invoice.items), selectinload(Invoice.customer))
                .order_by(Invoice.created_at.desc())
                .limit(6)
            )
            for inv in self.db.execute(inv_recent_stmt).scalars().all():
                c_name = inv.customer.name if inv.customer else (inv.notes if inv.notes and len(inv.notes) < 30 else "Walk-in Customer")
                recent_invoices.append(
                    RecentActivity(
                        id=inv.id,
                        invoice_number=inv.invoice_number,
                        created_at=inv.created_at,
                        customer_name=c_name,
                        total_amount=round(float(inv.total_amount), 2),
                        payment_method=inv.payment_method.value if hasattr(inv.payment_method, "value") else str(inv.payment_method),
                        status=inv.status.value if hasattr(inv.status, "value") else str(inv.status),
                        items_count=len(inv.items),
                    )
                )
        else:
            sale_recent_stmt = (
                select(Sale)
                .options(selectinload(Sale.items))
                .order_by(Sale.sale_date.desc())
                .limit(6)
            )
            for s in self.db.execute(sale_recent_stmt).scalars().all():
                recent_invoices.append(
                    RecentActivity(
                        id=s.id,
                        invoice_number=s.invoice_number,
                        created_at=s.sale_date,
                        customer_name=s.customer_name or "Walk-in Customer",
                        total_amount=round(float(s.total_amount), 2),
                        payment_method=s.payment_method,
                        status="completed",
                        items_count=len(s.items),
                    )
                )

        # ---------------------------------------------------------------------
        # 7. LOW STOCK ALERTS
        # ---------------------------------------------------------------------
        low_stock_alerts: list[LowStockAlert] = []
        low_stock_query = (
            select(Product)
            .where(
                Product.status == "active",
                Product.quantity <= Product.min_stock_level,
            )
            .order_by(Product.quantity.asc(), Product.name.asc())
            .limit(6)
        )
        for p in self.db.execute(low_stock_query).scalars().all():
            low_stock_alerts.append(
                LowStockAlert(
                    id=p.id,
                    name=p.name,
                    code=p.code,
                    category=p.category,
                    quantity=p.quantity,
                    min_stock_level=p.min_stock_level,
                    unit=p.unit,
                    cost_price=float(p.cost_price),
                    selling_price=float(p.selling_price),
                    is_out_of_stock=(p.quantity <= 0),
                )
            )

        # ---------------------------------------------------------------------
        # 8. CATEGORY BREAKDOWN
        # ---------------------------------------------------------------------
        category_distribution: list[CategoryBreakdown] = []
        cat_stmt = (
            select(
                Product.category,
                func.count(Product.id).label("prod_count"),
                func.coalesce(func.sum(Product.quantity), 0).label("stock_sum"),
                func.coalesce(func.sum(Product.quantity * Product.cost_price), 0.0).label("val_sum"),
            )
            .where(Product.status == "active")
            .group_by(Product.category)
            .order_by(func.count(Product.id).desc())
            .limit(6)
        )
        for row in self.db.execute(cat_stmt).all():
            category_distribution.append(
                CategoryBreakdown(
                    category=row.category,
                    product_count=int(row.prod_count or 0),
                    stock_units=int(row.stock_sum or 0),
                    inventory_value=round(float(row.val_sum or 0.0), 2),
                )
            )

        return DashboardResponse(
            summary=summary,
            sales_trend_days=sales_trend_days,
            monthly_trend=monthly_trend,
            top_selling_products=top_selling_products,
            recent_invoices=recent_invoices,
            low_stock_alerts=low_stock_alerts,
            category_distribution=category_distribution,
            last_updated=now,
        )


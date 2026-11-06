from datetime import datetime
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.product import Product
from app.models.report import Purchase, PurchaseItem, Sale, SaleItem, SupplierPayment
from app.schemas.report import (
    CurrentStockItem,
    CurrentStockReportResponse,
    LowStockItem,
    LowStockReportResponse,
    OutOfStockItem,
    OutOfStockReportResponse,
    PurchaseByProductItem,
    PurchaseByProductResponse,
    PurchaseBySupplierItem,
    PurchaseBySupplierResponse,
    PurchaseHistoryItem,
    PurchaseHistoryResponse,
    SaleItemDetail,
    SaleRecord,
    SalesReportResponse,
    SalesReportSummary,
    SupplierPaymentItem,
    SupplierPaymentRecord,
    SupplierPaymentResponse,
    ReportOverviewResponse,
)


class ReportRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_overview(self, start_date: datetime, end_date: datetime) -> ReportOverviewResponse:
        sales_stmt = select(
            func.coalesce(func.sum(Sale.total_amount), 0.0),
            func.count(Sale.id),
        ).where(Sale.sale_date >= start_date, Sale.sale_date <= end_date)
        sales_total, transactions_count = self.db.execute(sales_stmt).one()

        products = list(self.db.execute(select(Product).where(Product.is_active == True)).scalars().all())
        stock_value = sum(float(p.cost_price or p.price) * p.quantity for p in products)
        total_stock_items = sum(p.quantity for p in products)
        low_stock_count = sum(1 for p in products if p.quantity <= (p.min_stock_level or 5) and p.quantity > 0)
        out_of_stock_count = sum(1 for p in products if p.quantity <= 0)

        payments_stmt = select(
            func.coalesce(func.sum(SupplierPayment.outstanding_balance), 0.0),
            func.coalesce(func.sum(SupplierPayment.paid_amount), 0.0),
        )
        pending_payables, total_paid = self.db.execute(payments_stmt).one()

        return ReportOverviewResponse(
            sales_total=round(float(sales_total), 2),
            transactions_count=int(transactions_count),
            stock_value=round(float(stock_value), 2),
            total_stock_items=int(total_stock_items),
            low_stock_count=int(low_stock_count),
            out_of_stock_count=int(out_of_stock_count),
            pending_payables=round(float(pending_payables), 2),
            total_paid_suppliers=round(float(total_paid), 2),
        )

    def get_sales_report(
        self, start_date: datetime, end_date: datetime, period: str = "daily"
    ) -> SalesReportResponse:
        stmt = (
            select(Sale)
            .options(selectinload(Sale.items))
            .where(Sale.sale_date >= start_date, Sale.sale_date <= end_date)
            .order_by(Sale.sale_date.desc())
        )
        sales_records = list(self.db.execute(stmt).scalars().all())

        total_amount = sum(float(s.total_amount) for s in sales_records)
        total_discount = sum(float(s.discount_amount) for s in sales_records)
        total_transactions = len(sales_records)
        total_products_sold = sum(sum(item.quantity for item in s.items) for s in sales_records)

        sales_list = []
        for s in sales_records:
            items_detail = [
                SaleItemDetail(
                    id=item.id,
                    product_name=item.product_name,
                    product_code=item.product_code,
                    quantity=item.quantity,
                    unit_price=float(item.unit_price),
                    subtotal=float(item.subtotal),
                )
                for item in s.items
            ]
            sales_list.append(
                SaleRecord(
                    id=s.id,
                    invoice_number=s.invoice_number,
                    sale_date=s.sale_date,
                    subtotal=float(s.subtotal),
                    discount_amount=float(s.discount_amount),
                    tax_amount=float(s.tax_amount),
                    total_amount=float(s.total_amount),
                    payment_method=s.payment_method,
                    cashier_name=s.cashier_name,
                    customer_name=s.customer_name,
                    items_count=sum(i.quantity for i in s.items),
                    items=items_detail,
                )
            )

        summary = SalesReportSummary(
            total_sales_amount=round(total_amount, 2),
            number_of_transactions=total_transactions,
            products_sold_count=total_products_sold,
            total_discounts=round(total_discount, 2),
        )

        return SalesReportResponse(
            period=period,
            start_date=start_date,
            end_date=end_date,
            summary=summary,
            sales=sales_list,
        )

    def get_current_stock_report(
        self, category: str | None = None, search: str | None = None
    ) -> CurrentStockReportResponse:
        stmt = select(Product).where(Product.status != "archived")

        if category and category.lower() != "all":
            stmt = stmt.where(Product.category.ilike(category))
        if search and search.strip():
            pat = f"%{search.strip()}%"
            stmt = stmt.where(or_(Product.name.ilike(pat), Product.code.ilike(pat)))

        stmt = stmt.order_by(Product.name.asc())
        products = list(self.db.execute(stmt).scalars().all())

        items = []
        total_val = 0.0
        total_items = 0

        for p in products:
            qty = p.quantity
            val = round(qty * float(p.cost_price), 2)
            total_val += val
            total_items += qty
            items.append(
                CurrentStockItem(
                    product_name=p.name,
                    sku=p.code,
                    category=p.category,
                    current_quantity=qty,
                    purchase_price=float(p.cost_price),
                    selling_price=float(p.selling_price),
                    stock_value=val,
                )
            )

        return CurrentStockReportResponse(
            total_stock_value=round(total_val, 2),
            total_items_count=total_items,
            items=items,
        )

    def get_low_stock_report(
        self, category: str | None = None, search: str | None = None
    ) -> LowStockReportResponse:
        stmt = select(Product).where(
            Product.status != "archived",
            Product.quantity > 0,
            Product.quantity <= Product.min_stock_level,
        )

        if category and category.lower() != "all":
            stmt = stmt.where(Product.category.ilike(category))
        if search and search.strip():
            pat = f"%{search.strip()}%"
            stmt = stmt.where(or_(Product.name.ilike(pat), Product.code.ilike(pat)))

        stmt = stmt.order_by(Product.quantity.asc())
        products = list(self.db.execute(stmt).scalars().all())

        items = [
            LowStockItem(
                product_name=p.name,
                sku=p.code,
                current_quantity=p.quantity,
                low_stock_level=p.min_stock_level,
                stock_status="Low Stock",
            )
            for p in products
        ]

        return LowStockReportResponse(
            low_stock_count=len(items),
            items=items,
        )

    def get_out_of_stock_report(
        self, category: str | None = None, search: str | None = None
    ) -> OutOfStockReportResponse:
        stmt = select(Product).where(Product.status != "archived", Product.quantity <= 0)

        if category and category.lower() != "all":
            stmt = stmt.where(Product.category.ilike(category))
        if search and search.strip():
            pat = f"%{search.strip()}%"
            stmt = stmt.where(or_(Product.name.ilike(pat), Product.code.ilike(pat)))

        stmt = stmt.order_by(Product.name.asc())
        products = list(self.db.execute(stmt).scalars().all())

        items = [
            OutOfStockItem(
                product_name=p.name,
                sku=p.code,
                category=p.category,
                brand=p.brand,
                last_stock_availability=p.updated_at,
            )
            for p in products
        ]

        return OutOfStockReportResponse(
            out_of_stock_count=len(items),
            items=items,
        )

    def get_purchases_by_supplier(
        self, start_date: datetime, end_date: datetime
    ) -> PurchaseBySupplierResponse:
        stmt = (
            select(
                Purchase.supplier_name,
                func.count(Purchase.id).label("num_purchases"),
                func.sum(Purchase.total_amount).label("total_amt"),
                func.sum(Purchase.paid_amount).label("total_paid"),
                func.sum(Purchase.outstanding_amount).label("total_out"),
            )
            .where(Purchase.purchase_date >= start_date, Purchase.purchase_date <= end_date)
            .group_by(Purchase.supplier_name)
            .order_by(func.sum(Purchase.total_amount).desc())
        )
        rows = list(self.db.execute(stmt).all())

        suppliers = []
        grand_total = 0.0
        grand_outstanding = 0.0

        for r in rows:
            tot = float(r.total_amt or 0)
            paid = float(r.total_paid or 0)
            out = float(r.total_out or 0)
            grand_total += tot
            grand_outstanding += out
            suppliers.append(
                PurchaseBySupplierItem(
                    supplier_name=r.supplier_name,
                    number_of_purchases=r.num_purchases,
                    total_purchase_amount=round(tot, 2),
                    paid_amount=round(paid, 2),
                    outstanding_amount=round(out, 2),
                )
            )

        return PurchaseBySupplierResponse(
            total_purchases_amount=round(grand_total, 2),
            total_outstanding=round(grand_outstanding, 2),
            suppliers=suppliers,
        )

    def get_purchases_by_product(
        self, start_date: datetime, end_date: datetime
    ) -> PurchaseByProductResponse:
        stmt = (
            select(
                PurchaseItem.product_name,
                PurchaseItem.product_code,
                func.sum(PurchaseItem.quantity).label("total_qty"),
                func.sum(PurchaseItem.subtotal).label("total_cost"),
                func.max(Purchase.purchase_date).label("last_date"),
            )
            .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
            .where(Purchase.purchase_date >= start_date, Purchase.purchase_date <= end_date)
            .group_by(PurchaseItem.product_name, PurchaseItem.product_code)
            .order_by(func.sum(PurchaseItem.subtotal).desc())
        )
        rows = list(self.db.execute(stmt).all())

        items = []
        grand_cost = 0.0
        grand_qty = 0

        for r in rows:
            qty = int(r.total_qty or 0)
            cost = float(r.total_cost or 0)
            grand_qty += qty
            grand_cost += cost
            items.append(
                PurchaseByProductItem(
                    product_name=r.product_name,
                    sku=r.product_code,
                    quantity_purchased=qty,
                    total_purchase_cost=round(cost, 2),
                    last_purchase_date=r.last_date,
                )
            )

        return PurchaseByProductResponse(
            total_cost=round(grand_cost, 2),
            total_units_purchased=grand_qty,
            products=items,
        )

    def get_purchase_history(
        self, start_date: datetime, end_date: datetime
    ) -> PurchaseHistoryResponse:
        stmt = (
            select(Purchase)
            .where(Purchase.purchase_date >= start_date, Purchase.purchase_date <= end_date)
            .order_by(Purchase.purchase_date.desc())
        )
        purchases = list(self.db.execute(stmt).scalars().all())

        total_amount = sum(float(p.total_amount) for p in purchases)
        items = [
            PurchaseHistoryItem(
                id=p.id,
                purchase_number=p.purchase_number,
                supplier_name=p.supplier_name,
                purchase_date=p.purchase_date,
                total_amount=float(p.total_amount),
                payment_status=p.payment_status,
            )
            for p in purchases
        ]

        return PurchaseHistoryResponse(
            total_amount=round(total_amount, 2),
            purchases=items,
        )

    def get_supplier_payment_report(self) -> SupplierPaymentResponse:
        suppliers_stmt = select(Purchase.supplier_name).distinct()
        supplier_names = list(self.db.execute(suppliers_stmt).scalars().all())

        items = []
        grand_paid = 0.0
        grand_out = 0.0

        for name in supplier_names:
            totals_stmt = select(
                func.sum(Purchase.total_amount).label("tot"),
                func.sum(Purchase.paid_amount).label("paid"),
                func.sum(Purchase.outstanding_amount).label("out"),
            ).where(Purchase.supplier_name == name)
            t_row = self.db.execute(totals_stmt).one_or_none()

            tot = float(t_row.tot or 0) if t_row else 0.0
            paid = float(t_row.paid or 0) if t_row else 0.0
            out = float(t_row.out or 0) if t_row else 0.0
            grand_paid += paid
            grand_out += out

            payments_stmt = (
                select(SupplierPayment)
                .where(SupplierPayment.supplier_name == name)
                .order_by(SupplierPayment.payment_date.desc())
            )
            pmts = list(self.db.execute(payments_stmt).scalars().all())
            pmt_records = [
                SupplierPaymentRecord(
                    id=p.id,
                    payment_date=p.payment_date,
                    amount=float(p.amount),
                    payment_method=p.payment_method,
                    reference_number=p.reference_number,
                )
                for p in pmts
            ]

            items.append(
                SupplierPaymentItem(
                    supplier_name=name,
                    total_amount=round(tot, 2),
                    paid_amount=round(paid, 2),
                    outstanding_balance=round(out, 2),
                    payments=pmt_records,
                )
            )

        return SupplierPaymentResponse(
            total_paid=round(grand_paid, 2),
            total_outstanding=round(grand_out, 2),
            suppliers=items,
        )


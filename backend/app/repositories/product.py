import json
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.product import Brand, Category, Product, ProductActivity, StockMovement
from app.schemas.product import (
    BrandCreate,
    CategoryCreate,
    ProductCreate,
    ProductStatisticsResponse,
    ProductUpdate,
    StockAdjustmentCreate,
)


class ProductRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, product_id: int) -> Product | None:
        return self.db.get(Product, product_id)

    def get_by_code(self, code: str) -> Product | None:
        stmt = select(Product).where(Product.code == code)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_barcode(self, barcode: str) -> Product | None:
        if not barcode:
            return None
        stmt = select(Product).where(Product.barcode == barcode)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_all(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
        category: str | None = None,
        brand: str | None = None,
        status: str | None = None,
        stock_status: str | None = None,
        supplier: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[Product], int]:
        stmt = select(Product)
        count_stmt = select(func.count()).select_from(Product)

        filters = []

        if search:
            pattern = f"%{search.strip()}%"
            search_filter = or_(
                Product.name.ilike(pattern),
                Product.code.ilike(pattern),
                Product.barcode.ilike(pattern),
                Product.brand.ilike(pattern),
                Product.category.ilike(pattern),
                Product.compatible_models.ilike(pattern),
                Product.supplier_code.ilike(pattern),
            )
            filters.append(search_filter)

        if category:
            filters.append(Product.category.ilike(category))

        if brand:
            filters.append(Product.brand.ilike(brand))

        if status and status.lower() != "all":
            filters.append(Product.status == status.lower())

        if stock_status:
            if stock_status == "out_of_stock":
                filters.append(Product.quantity <= 0)
            elif stock_status == "low_stock":
                filters.append((Product.quantity > 0) & (Product.quantity <= Product.min_stock_level))
            elif stock_status == "in_stock":
                filters.append(Product.quantity > Product.min_stock_level)

        if supplier:
            filters.append(Product.supplier_name.ilike(f"%{supplier}%"))

        if min_price is not None:
            filters.append(Product.selling_price >= min_price)

        if max_price is not None:
            filters.append(Product.selling_price <= max_price)

        for f in filters:
            stmt = stmt.where(f)
            count_stmt = count_stmt.where(f)

        total: int = self.db.execute(count_stmt).scalar_one()

        # Sorting
        order_col = getattr(Product, sort_by, Product.created_at)
        if sort_order.lower() == "asc":
            stmt = stmt.order_by(order_col.asc())
        else:
            stmt = stmt.order_by(order_col.desc())

        products = list(self.db.execute(stmt.offset(skip).limit(limit)).scalars().all())
        return products, total

    def create(self, data: ProductCreate) -> Product:
        dump = data.model_dump()
        product = Product(**dump)
        self.db.add(product)
        self.db.flush()

        # Initial stock movement record if opening stock > 0
        if product.quantity > 0:
            initial_movement = StockMovement(
                product_id=product.id,
                movement_type="opening_stock",
                previous_quantity=0,
                adjustment_quantity=product.quantity,
                new_quantity=product.quantity,
                reason="Initial Opening Stock upon Product Creation",
                user_name="Admin",
            )
            self.db.add(initial_movement)

        # Activity log
        activity = ProductActivity(
            product_id=product.id,
            action="CREATED",
            details=f"Product '{product.name}' created with SKU '{product.code}'.",
            user_name="Admin",
        )
        self.db.add(activity)

        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product: Product, data: ProductUpdate) -> Product:
        update_data = data.model_dump(exclude_unset=True)
        changes = []

        for field, new_val in update_data.items():
            old_val = getattr(product, field, None)
            if old_val != new_val:
                setattr(product, field, new_val)
                changes.append(f"{field}: {old_val} -> {new_val}")

        if changes:
            activity = ProductActivity(
                product_id=product.id,
                action="UPDATED",
                details=f"Product updated: {', '.join(changes[:4])}",
                user_name="Admin",
            )
            self.db.add(activity)

        self.db.commit()
        self.db.refresh(product)
        return product

    def delete(self, product: Product) -> None:
        self.db.delete(product)
        self.db.commit()

    def adjust_stock(self, product: Product, data: StockAdjustmentCreate) -> StockMovement:
        prev_qty = product.quantity
        adj = data.adjustment_quantity

        if data.adjustment_type in ["increase", "correction_plus"]:
            new_qty = prev_qty + adj
            change = adj
        elif data.adjustment_type in ["decrease", "damaged", "lost"]:
            new_qty = max(0, prev_qty - adj)
            change = -adj
        elif data.adjustment_type == "correction":
            new_qty = max(0, adj)
            change = new_qty - prev_qty
        else:
            new_qty = prev_qty + adj
            change = adj

        product.quantity = new_qty

        movement = StockMovement(
            product_id=product.id,
            movement_type=data.adjustment_type,
            previous_quantity=prev_qty,
            adjustment_quantity=change,
            new_quantity=new_qty,
            reason=data.reason,
            notes=data.notes,
            user_name=data.user_name,
        )
        self.db.add(movement)

        activity = ProductActivity(
            product_id=product.id,
            action="STOCK_ADJUSTED",
            details=f"Stock adjusted ({data.adjustment_type}) from {prev_qty} to {new_qty}. Reason: {data.reason}",
            user_name=data.user_name,
        )
        self.db.add(activity)

        self.db.commit()
        self.db.refresh(movement)
        return movement

    def get_stock_movements(self, product_id: int) -> list[StockMovement]:
        stmt = (
            select(StockMovement)
            .where(StockMovement.product_id == product_id)
            .order_by(StockMovement.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_activity_logs(self, product_id: int) -> list[ProductActivity]:
        stmt = (
            select(ProductActivity)
            .where(ProductActivity.product_id == product_id)
            .order_by(ProductActivity.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_statistics(self) -> ProductStatisticsResponse:
        total = self.db.execute(select(func.count(Product.id))).scalar_one() or 0
        active = (
            self.db.execute(
                select(func.count(Product.id)).where(Product.status == "active")
            ).scalar_one()
            or 0
        )
        low_stock = (
            self.db.execute(
                select(func.count(Product.id)).where(
                    (Product.quantity > 0) & (Product.quantity <= Product.min_stock_level)
                )
            ).scalar_one()
            or 0
        )
        out_of_stock = (
            self.db.execute(
                select(func.count(Product.id)).where(Product.quantity <= 0)
            ).scalar_one()
            or 0
        )
        total_val = (
            self.db.execute(
                select(func.sum(Product.quantity * Product.cost_price))
            ).scalar_one()
            or 0.0
        )
        cat_count = (
            self.db.execute(select(func.count(func.distinct(Product.category)))).scalar_one()
            or 0
        )

        return ProductStatisticsResponse(
            total_products=total,
            active_products=active,
            low_stock_products=low_stock,
            out_of_stock_products=out_of_stock,
            total_inventory_value=float(total_val),
            categories_count=cat_count,
        )

    def bulk_action(self, product_ids: list[int], action: str, parameters: dict[str, Any] | None = None) -> int:
        if not product_ids:
            return 0
        count = 0
        for pid in product_ids:
            prod = self.get_by_id(pid)
            if not prod:
                continue
            if action == "activate":
                prod.status = "active"
                count += 1
            elif action == "deactivate":
                prod.status = "inactive"
                count += 1
            elif action == "archive":
                prod.status = "archived"
                count += 1
            elif action == "delete":
                self.db.delete(prod)
                count += 1
            elif action == "update_price" and parameters:
                if "cost_price" in parameters:
                    prod.cost_price = float(parameters["cost_price"])
                if "selling_price" in parameters:
                    prod.selling_price = float(parameters["selling_price"])
                count += 1
            elif action == "adjust_stock" and parameters:
                qty_change = int(parameters.get("quantity_change", 0))
                prod.quantity = max(0, prod.quantity + qty_change)
                count += 1
        self.db.commit()
        return count

    # Categories
    def list_categories(self) -> list[Category]:
        return list(self.db.execute(select(Category).order_by(Category.name.asc())).scalars().all())

    def create_category(self, data: CategoryCreate) -> Category:
        cat = Category(**data.model_dump())
        self.db.add(cat)
        self.db.commit()
        self.db.refresh(cat)
        return cat

    # Brands
    def list_brands(self) -> list[Brand]:
        return list(self.db.execute(select(Brand).order_by(Brand.name.asc())).scalars().all())

    def create_brand(self, data: BrandCreate) -> Brand:
        b = Brand(**data.model_dump())
        self.db.add(b)
        self.db.commit()
        self.db.refresh(b)
        return b

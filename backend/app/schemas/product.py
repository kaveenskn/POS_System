from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, examples=["Chain Kit"])
    code: str = Field(..., min_length=1, max_length=100, examples=["CK-001"])
    barcode: str | None = Field(None, max_length=100, examples=["8901234567890"])
    barcode_type: str = Field("CODE128", max_length=20)
    category: str = Field("Motorcycle Spare Parts", max_length=100)
    subcategory: str | None = Field(None, max_length=100)
    brand: str = Field(..., min_length=1, max_length=255, examples=["DID"])
    product_type: str = Field("standard", max_length=50)
    status: str = Field("active", max_length=30)
    description: str | None = Field(None, max_length=2000)
    image_url: str | None = Field(None)

    cost_price: float = Field(..., gt=0, examples=[850.00])
    selling_price: float = Field(..., gt=0, examples=[1200.00])
    wholesale_price: float | None = Field(None, gt=0)
    min_selling_price: float | None = Field(None, gt=0)
    default_discount: float = Field(0.0, ge=0)
    tax_rate: float = Field(0.0, ge=0)

    quantity: int = Field(0, ge=0, examples=[25])
    opening_stock: int = Field(0, ge=0)
    unit: str = Field("Pieces", max_length=50)
    min_stock_level: int = Field(5, ge=0)
    reorder_level: int = Field(10, ge=0)
    max_stock_level: int | None = Field(None, ge=0)
    warehouse_location: str | None = Field(None, max_length=100)
    rack_number: str | None = Field(None, max_length=50)
    shelf_number: str | None = Field(None, max_length=50)
    stock_tracking_enabled: bool = Field(True)

    supplier_name: str | None = Field(None, max_length=255)
    supplier_code: str | None = Field(None, max_length=100)
    supplier_price: float | None = Field(None, gt=0)
    preferred_supplier: bool = Field(False)
    estimated_delivery_days: int | None = Field(None, ge=0)

    compatible_models: str | None = Field(None)
    compatible_years: str | None = Field(None, max_length=100)
    warranty_period: str | None = Field(None, max_length=100)
    dimensions: str | None = Field(None, max_length=100)
    weight: str | None = Field(None, max_length=50)
    specifications: str | None = Field(None)
    internal_notes: str | None = Field(None)
    is_featured: bool = Field(False)
    variations_json: str | None = Field(None)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, min_length=1, max_length=100)
    barcode: str | None = Field(None, max_length=100)
    barcode_type: str | None = Field(None, max_length=20)
    category: str | None = Field(None, max_length=100)
    subcategory: str | None = Field(None, max_length=100)
    brand: str | None = Field(None, min_length=1, max_length=255)
    product_type: str | None = Field(None, max_length=50)
    status: str | None = Field(None, max_length=30)
    description: str | None = Field(None, max_length=2000)
    image_url: str | None = Field(None)

    cost_price: float | None = Field(None, gt=0)
    selling_price: float | None = Field(None, gt=0)
    wholesale_price: float | None = Field(None, gt=0)
    min_selling_price: float | None = Field(None, gt=0)
    default_discount: float | None = Field(None, ge=0)
    tax_rate: float | None = Field(None, ge=0)

    quantity: int | None = Field(None, ge=0)
    opening_stock: int | None = Field(None, ge=0)
    unit: str | None = Field(None, max_length=50)
    min_stock_level: int | None = Field(None, ge=0)
    reorder_level: int | None = Field(None, ge=0)
    max_stock_level: int | None = Field(None, ge=0)
    warehouse_location: str | None = Field(None, max_length=100)
    rack_number: str | None = Field(None, max_length=50)
    shelf_number: str | None = Field(None, max_length=50)
    stock_tracking_enabled: bool | None = Field(None)

    supplier_name: str | None = Field(None, max_length=255)
    supplier_code: str | None = Field(None, max_length=100)
    supplier_price: float | None = Field(None, gt=0)
    preferred_supplier: bool | None = Field(None)
    estimated_delivery_days: int | None = Field(None, ge=0)

    compatible_models: str | None = Field(None)
    compatible_years: str | None = Field(None, max_length=100)
    warranty_period: str | None = Field(None, max_length=100)
    dimensions: str | None = Field(None, max_length=100)
    weight: str | None = Field(None, max_length=50)
    specifications: str | None = Field(None)
    internal_notes: str | None = Field(None)
    is_featured: bool | None = Field(None)
    variations_json: str | None = Field(None)


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int


class StockAdjustmentCreate(BaseModel):
    adjustment_type: str = Field(..., examples=["increase", "decrease", "damaged", "lost", "correction"])
    adjustment_quantity: int = Field(..., examples=[5])
    reason: str = Field(..., min_length=2, max_length=255, examples=["Supplier restock arrival"])
    notes: str | None = Field(None, max_length=1000)
    user_name: str = Field("Admin", max_length=100)


class StockMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    movement_type: str
    previous_quantity: int
    adjustment_quantity: int
    new_quantity: int
    reason: str
    notes: str | None
    user_name: str
    created_at: datetime


class ProductActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    action: str
    details: str
    user_name: str
    created_at: datetime


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None)
    subcategories: str | None = Field(None)


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class BrandBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    origin_country: str | None = Field(None, max_length=100)
    description: str | None = Field(None)


class BrandCreate(BrandBase):
    pass


class BrandResponse(BrandBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class ProductStatisticsResponse(BaseModel):
    total_products: int
    active_products: int
    low_stock_products: int
    out_of_stock_products: int
    total_inventory_value: float
    categories_count: int


class BulkActionRequest(BaseModel):
    product_ids: list[int]
    action: str = Field(..., examples=["activate", "deactivate", "archive", "delete", "update_price", "adjust_stock"])
    parameters: dict[str, Any] | None = Field(None)

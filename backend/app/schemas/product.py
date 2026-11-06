from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, examples=["Chain Kit"])
    code: str = Field(..., min_length=1, max_length=100, examples=["CK-001"])
    brand: str = Field(..., min_length=1, max_length=255, examples=["DID"])
    cost_price: float = Field(..., gt=0, examples=[850.00])
    selling_price: float = Field(..., gt=0, examples=[1200.00])
    description: str | None = Field(
        None, max_length=2000, examples=["420-120L chain and sprocket kit"]
    )
    quantity: int = Field(0, ge=0, examples=[25])


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, min_length=1, max_length=100)
    brand: str | None = Field(None, min_length=1, max_length=255)
    cost_price: float | None = Field(None, gt=0)
    selling_price: float | None = Field(None, gt=0)
    description: str | None = Field(None, max_length=2000)
    quantity: int | None = Field(None, ge=0)


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int

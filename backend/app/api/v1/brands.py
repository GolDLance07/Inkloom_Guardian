import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.base import Brand
from app.schemas.base import BrandCreate, BrandUpdate, BrandResponse
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/brands", tags=["brands"])


def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s or "brand"


@router.get("", response_model=List[BrandResponse])
def list_brands(
    include_demo: bool = Query(True),
    db: Session = Depends(get_db),
):
    query = db.query(Brand)
    if not include_demo:
        query = query.filter(Brand.is_demo == False)
    return query.order_by(Brand.created_at.desc()).all()


@router.post("", response_model=BrandResponse, status_code=201)
def create_brand(
    payload: BrandCreate,
    db: Session = Depends(get_db),
):
    base_slug = payload.slug or slugify(payload.name)
    slug = base_slug
    counter = 1
    while db.query(Brand).filter(Brand.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    brand = Brand(
        name=payload.name,
        slug=slug,
        description=payload.description,
        industry=payload.industry,
        logo_url=payload.logo_url,
        visual_config=payload.visual_config,
        is_demo=False,
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)

    record_audit_event(
        db=db,
        brand_id=brand.id,
        event_type="brand_created",
        details={"name": brand.name, "slug": brand.slug},
    )

    return brand


@router.get("/{brand_id}", response_model=BrandResponse)
def get_brand(
    brand_id: str,
    db: Session = Depends(get_db),
):
    brand = db.query(Brand).filter((Brand.id == brand_id) | (Brand.slug == brand_id)).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.patch("/{brand_id}", response_model=BrandResponse)
def update_brand(
    brand_id: str,
    payload: BrandUpdate,
    db: Session = Depends(get_db),
):
    brand = db.query(Brand).filter((Brand.id == brand_id) | (Brand.slug == brand_id)).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(brand, field, val)

    db.commit()
    db.refresh(brand)

    record_audit_event(
        db=db,
        brand_id=brand.id,
        event_type="brand_updated",
        details=update_data,
    )

    return brand

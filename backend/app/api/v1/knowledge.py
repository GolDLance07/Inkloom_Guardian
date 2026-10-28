from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.base import Brand, KnowledgeItem
from app.schemas.base import KnowledgeItemCreate, KnowledgeItemUpdate, KnowledgeItemResponse
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/brands/{brand_id}/knowledge", tags=["knowledge"])


def get_verified_brand(brand_id: str, db: Session) -> Brand:
    brand = db.query(Brand).filter((Brand.id == brand_id) | (Brand.slug == brand_id)).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.get("", response_model=List[KnowledgeItemResponse])
def list_knowledge(
    brand_id: str,
    kind: Optional[str] = Query(None),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    brand = get_verified_brand(brand_id, db)
    query = db.query(KnowledgeItem).filter(KnowledgeItem.brand_id == brand.id)
    if kind:
        query = query.filter(KnowledgeItem.kind == kind)
    if active_only:
        query = query.filter(KnowledgeItem.active == True)
    return query.order_by(KnowledgeItem.created_at.desc()).all()


@router.post("", response_model=KnowledgeItemResponse, status_code=201)
def create_knowledge_item(
    brand_id: str,
    payload: KnowledgeItemCreate,
    db: Session = Depends(get_db),
):
    brand = get_verified_brand(brand_id, db)
    item = KnowledgeItem(
        brand_id=brand.id,
        kind=payload.kind,
        title=payload.title,
        content=payload.content,
        normalized_value=payload.normalized_value,
        source_label=payload.source_label,
        active=payload.active,
        rule_config=payload.rule_config,
        extra_metadata=payload.metadata,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    record_audit_event(
        db=db,
        brand_id=brand.id,
        event_type="knowledge_item_created",
        details={"id": item.id, "kind": item.kind, "title": item.title},
    )

    return item


@router.patch("/{item_id}", response_model=KnowledgeItemResponse)
def update_knowledge_item(
    brand_id: str,
    item_id: str,
    payload: KnowledgeItemUpdate,
    db: Session = Depends(get_db),
):
    brand = get_verified_brand(brand_id, db)
    item = db.query(KnowledgeItem).filter(
        KnowledgeItem.id == item_id,
        KnowledgeItem.brand_id == brand.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "metadata" in update_data:
        item.extra_metadata = update_data.pop("metadata")
    for field, val in update_data.items():
        setattr(item, field, val)

    db.commit()
    db.refresh(item)

    record_audit_event(
        db=db,
        brand_id=brand.id,
        event_type="knowledge_item_updated",
        details={"id": item.id, "updated_fields": list(update_data.keys())},
    )

    return item


@router.delete("/{item_id}")
def delete_or_deactivate_knowledge_item(
    brand_id: str,
    item_id: str,
    permanent: bool = Query(False),
    db: Session = Depends(get_db),
):
    brand = get_verified_brand(brand_id, db)
    item = db.query(KnowledgeItem).filter(
        KnowledgeItem.id == item_id,
        KnowledgeItem.brand_id == brand.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")

    if permanent:
        db.delete(item)
        db.commit()
        record_audit_event(
            db=db,
            brand_id=brand.id,
            event_type="knowledge_item_deleted",
            details={"id": item_id},
        )
        return {"status": "deleted", "id": item_id}
    else:
        item.active = False
        db.commit()
        record_audit_event(
            db=db,
            brand_id=brand.id,
            event_type="knowledge_item_deactivated",
            details={"id": item_id},
        )
        return {"status": "deactivated", "id": item_id}

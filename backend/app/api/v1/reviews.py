from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db import get_db
from app.models.base import Brand, Review, ReviewGroup, Finding, Decision
from app.schemas.base import ReviewCreate, ReviewResponse, ReviewGroupHistoryResponse, ReviewGroupHistoryItem
from app.services.review_service import execute_review, format_review_response
from app.config import settings

router = APIRouter(tags=["reviews"])


@router.post("/reviews", response_model=ReviewResponse, status_code=201)
async def create_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
):
    if len(payload.content) > settings.MAX_CONTENT_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Content exceeds maximum allowable limit of {settings.MAX_CONTENT_CHARS} characters",
        )
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    try:
        review = await execute_review(
            db=db,
            brand_id=payload.brand_id,
            title=payload.title,
            content=payload.content,
            review_group_id=payload.review_group_id,
            run_ai=payload.run_ai,
        )
        return format_review_response(review, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Review engine failed: {str(e)}")


@router.get("/reviews/{review_id}", response_model=ReviewResponse)
def get_review(
    review_id: str,
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review snapshot not found")
    return format_review_response(review, db)


@router.get("/review-groups/{group_id}/history", response_model=ReviewGroupHistoryResponse)
def get_group_history(
    group_id: str,
    db: Session = Depends(get_db),
):
    group = db.query(ReviewGroup).filter(ReviewGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Review group not found")

    reviews = db.query(Review).filter(
        Review.review_group_id == group.id
    ).order_by(desc(Review.version_number)).all()

    history_items = []
    for r in reviews:
        count = db.query(Finding).filter(Finding.review_id == r.id).count()
        latest_dec = db.query(Decision).filter(Decision.review_id == r.id).order_by(desc(Decision.created_at)).first()
        history_items.append({
            "review_id": r.id,
            "version_number": r.version_number,
            "content": r.content,
            "engine_status": r.engine_status,
            "created_at": r.created_at,
            "finding_count": count,
            "latest_decision": latest_dec,
        })

    return {
        "review_group_id": group.id,
        "brand_id": group.brand_id,
        "title": group.title,
        "history": history_items,
    }


@router.get("/brands/{brand_id}/reviews", response_model=List[ReviewResponse])
def list_brand_reviews(
    brand_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    brand = db.query(Brand).filter((Brand.id == brand_id) | (Brand.slug == brand_id)).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    reviews = db.query(Review).filter(
        Review.brand_id == brand.id
    ).order_by(desc(Review.created_at)).limit(limit).all()

    return [format_review_response(r, db) for r in reviews]

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.base import Review, Decision
from app.schemas.base import DecisionCreate, DecisionResponse
from app.services.audit_service import record_audit_event

router = APIRouter(tags=["decisions"])


@router.post("/reviews/{review_id}/decisions", response_model=DecisionResponse, status_code=201)
def record_decision(
    review_id: str,
    payload: DecisionCreate,
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review snapshot not found")

    valid_decisions = {"approved", "needs_changes", "rejected"}
    if payload.decision not in valid_decisions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid decision '{payload.decision}'. Must be one of: {', '.join(valid_decisions)}",
        )

    # Idempotency guard against rapid duplicate clicks (within 10 seconds)
    latest_existing = (
        db.query(Decision)
        .filter(Decision.review_id == review.id)
        .order_by(Decision.created_at.desc())
        .first()
    )
    if (
        latest_existing
        and latest_existing.decision == payload.decision
        and (latest_existing.note or "") == (payload.note or "")
    ):
        now_utc = datetime.now(timezone.utc)
        created_utc = latest_existing.created_at if latest_existing.created_at.tzinfo else latest_existing.created_at.replace(tzinfo=timezone.utc)
        if abs((now_utc - created_utc).total_seconds()) < 10:
            return latest_existing

    decision = Decision(
        review_id=review.id,
        brand_id=review.brand_id,
        decision=payload.decision,
        reviewer_label=payload.reviewer_label,
        note=payload.note,
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)

    record_audit_event(
        db=db,
        brand_id=review.brand_id,
        review_id=review.id,
        event_type="decision_recorded",
        details={
            "decision": decision.decision,
            "reviewer_label": decision.reviewer_label,
            "version_number": review.version_number,
        },
    )

    return decision

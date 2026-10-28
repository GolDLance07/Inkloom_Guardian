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

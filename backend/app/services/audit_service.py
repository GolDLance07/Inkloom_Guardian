from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.base import AuditEvent


def record_audit_event(
    db: Session,
    brand_id: str,
    event_type: str,
    details: Dict[str, Any],
    review_id: Optional[str] = None,
) -> AuditEvent:
    event = AuditEvent(
        brand_id=brand_id,
        review_id=review_id,
        event_type=event_type,
        details=details,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

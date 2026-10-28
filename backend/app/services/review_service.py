from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.base import ReviewGroup, Review, Finding, KnowledgeItem, Decision, Brand
from app.services.rules_engine import run_deterministic_checks
from app.services.llm_provider import run_ai_review
from app.services.audit_service import record_audit_event


def calculate_score(critical: int, warning: int, info: int) -> int:
    # Score starts at 100, drops 20 per critical, 8 per warning, 2 per info, minimum 0
    penalty = (critical * 20) + (warning * 8) + (info * 2)
    return max(0, 100 - penalty)


async def execute_review(
    db: Session,
    brand_id: str,
    title: str,
    content: str,
    review_group_id: Optional[str] = None,
    run_ai: bool = True,
) -> Review:
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise ValueError(f"Brand {brand_id} not found")

    # 1. Resolve ReviewGroup
    if review_group_id:
        group = db.query(ReviewGroup).filter(
            ReviewGroup.id == review_group_id,
            ReviewGroup.brand_id == brand_id,
        ).first()
        if not group:
            raise ValueError(f"Review group {review_group_id} not found for brand {brand_id}")
    else:
        group = ReviewGroup(brand_id=brand_id, title=title)
        db.add(group)
        db.flush()

    # 2. Determine next version number
    last_review = db.query(Review).filter(
        Review.review_group_id == group.id
    ).order_by(desc(Review.version_number)).first()
    
    version_number = (last_review.version_number + 1) if last_review else 1

    # 3. Retrieve brand-scoped active knowledge items
    items = db.query(KnowledgeItem).filter(
        KnowledgeItem.brand_id == brand_id,
        KnowledgeItem.active == True,
    ).all()

    # 4. Run deterministic checks
    findings_data = run_deterministic_checks(content, items)

    # 5. Optional AI checks
    engine_status = "rules_only"
    if run_ai:
        items_dict = [
            {
                "id": it.id,
                "kind": it.kind,
                "title": it.title,
                "content": it.content,
                "source_label": it.source_label,
            }
            for it in items
        ]
        ai_findings = await run_ai_review(content, brand.name, items_dict)
        if ai_findings is not None:
            findings_data.extend(ai_findings)
            engine_status = "rules_and_ai"
        else:
            engine_status = "ai_unavailable"

    # 6. Save Review
    review = Review(
        review_group_id=group.id,
        brand_id=brand_id,
        version_number=version_number,
        content=content,
        engine_status=engine_status,
    )
    db.add(review)
    db.flush()

    # 7. Save Findings
    for fd in findings_data:
        finding = Finding(
            review_id=review.id,
            brand_id=brand_id,
            knowledge_item_id=fd.get("knowledge_item_id"),
            source_type=fd.get("source_type", "rule"),
            category=fd.get("category", "policy"),
            severity=fd.get("severity", "warning"),
            claim_status=fd.get("claim_status"),
            title=fd.get("title", ""),
            explanation=fd.get("explanation", ""),
            evidence=fd.get("evidence"),
            content_excerpt=fd.get("content_excerpt"),
            suggested_rewrite=fd.get("suggested_rewrite"),
            location_start=fd.get("location_start"),
            location_end=fd.get("location_end"),
        )
        db.add(finding)

    db.commit()
    db.refresh(review)

    # 8. Record audit event
    record_audit_event(
        db=db,
        brand_id=brand_id,
        review_id=review.id,
        event_type="review_executed",
        details={
            "version_number": version_number,
            "engine_status": engine_status,
            "finding_count": len(findings_data),
        },
    )

    return review


def format_review_response(review: Review, db: Session) -> Dict[str, Any]:
    findings = db.query(Finding).filter(Finding.review_id == review.id).all()
    latest_decision = db.query(Decision).filter(Decision.review_id == review.id).order_by(desc(Decision.created_at)).first()

    critical = sum(1 for f in findings if f.severity == "critical")
    warning = sum(1 for f in findings if f.severity == "warning")
    info = sum(1 for f in findings if f.severity == "info")
    score = calculate_score(critical, warning, info)

    group = review.review_group

    return {
        "id": review.id,
        "review_group_id": review.review_group_id,
        "brand_id": review.brand_id,
        "version_number": review.version_number,
        "title": group.title if group else "Untitled Draft",
        "content": review.content,
        "engine_status": review.engine_status,
        "created_at": review.created_at,
        "summary": {
            "total": len(findings),
            "critical": critical,
            "warning": warning,
            "info": info,
            "score": score,
        },
        "findings": findings,
        "latest_decision": latest_decision,
    }

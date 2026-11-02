import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from types import SimpleNamespace

from app.services.rules_engine import run_deterministic_checks

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("regression_runner")


def load_fixtures(fixture_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    if fixture_path is None:
        fixture_path = Path(__file__).resolve().parent.parent.parent / "tests" / "fixtures" / "regression_fixtures.json"
    
    if not fixture_path.exists():
        raise FileNotFoundError(f"Fixture file not found at {fixture_path}")
    
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("test_cases", [])


def create_knowledge_item_stub(item_dict: Dict[str, Any]):
    """Convert dict to an object with KnowledgeItem attributes required by rules_engine."""
    return SimpleNamespace(
        id=item_dict.get("id"),
        brand_id=item_dict.get("brand_id"),
        kind=item_dict.get("kind"),
        title=item_dict.get("title", ""),
        content=item_dict.get("content", ""),
        normalized_value=item_dict.get("normalized_value"),
        source_label=item_dict.get("source_label", "Policy"),
        active=item_dict.get("active", True),
        rule_config=item_dict.get("rule_config", {}),
        extra_metadata=item_dict.get("metadata", {}),
    )


def run_single_test_case(tc: Dict[str, Any]) -> Dict[str, Any]:
    tc_id = tc["id"]
    name = tc.get("name", tc_id)
    target_brand_id = tc.get("filter_brand_id", tc.get("brand_id"))
    draft_text = tc.get("draft_text", "")
    expected = tc.get("expected_findings", [])
    expect_rewrite = tc.get("expect_rewrite", False)

    # 1. Scope items by brand isolation and filter out items if filter_brand_id is set
    raw_items = tc.get("knowledge_items", [])
    scoped_items = [
        create_knowledge_item_stub(it)
        for it in raw_items
        if it.get("brand_id") == target_brand_id
    ]

    # 2. Run deterministic checks
    actual_findings = run_deterministic_checks(draft_text, scoped_items)

    errors = []

    # Check finding count
    if len(actual_findings) != len(expected):
        errors.append(
            f"Expected {len(expected)} findings, got {len(actual_findings)}."
        )

    # Validate each expected finding has a match
    for exp in expected:
        matched = False
        for act in actual_findings:
            cat_match = act.get("category") == exp.get("category")
            sev_match = (
                exp.get("severity") is None
                or act.get("severity") == exp.get("severity")
            )
            k_match = (
                exp.get("knowledge_item_id") is None
                or act.get("knowledge_item_id") == exp.get("knowledge_item_id")
            )
            claim_match = (
                exp.get("claim_status") is None
                or act.get("claim_status") == exp.get("claim_status")
            )
            if cat_match and sev_match and k_match and claim_match:
                matched = True
                break
        if not matched:
            errors.append(f"Expected finding not found in actual: {exp}")

    # If expect_rewrite is requested, verify rewrites are present
    if expect_rewrite:
        for act in actual_findings:
            if not act.get("suggested_rewrite"):
                errors.append(
                    f"Finding '{act.get('title')}' expected a suggested_rewrite, but none was generated."
                )

    return {
        "id": tc_id,
        "name": name,
        "passed": len(errors) == 0,
        "errors": errors,
        "actual_count": len(actual_findings),
        "expected_count": len(expected),
    }


def run_regression_suite(fixture_path: Optional[Path] = None) -> Dict[str, Any]:
    test_cases = load_fixtures(fixture_path)
    results = []
    passed = 0
    failed = 0

    for tc in test_cases:
        res = run_single_test_case(tc)
        results.append(res)
        if res["passed"]:
            passed += 1
        else:
            failed += 1

    return {
        "total": len(test_cases),
        "passed": passed,
        "failed": failed,
        "success": failed == 0,
        "results": results,
    }


def replay_historical_reviews(limit: int = 20) -> Dict[str, Any]:
    """
    Replays recent reviews stored in the database against the current active rules.
    Identifies rule drift without mutating historical review records.
    """
    from app.db import SessionLocal
    from app.models.base import Review, KnowledgeItem, Finding

    with SessionLocal() as db:
        reviews = (
            db.query(Review)
            .order_by(Review.created_at.desc())
            .limit(limit)
            .all()
        )
        if not reviews:
            return {"total_replayed": 0, "message": "No historical reviews found to replay."}

        replay_results = []
        drift_detected = 0

        for rev in reviews:
            # Load current active knowledge items for the review's brand
            active_items = (
                db.query(KnowledgeItem)
                .filter(
                    KnowledgeItem.brand_id == rev.brand_id,
                    KnowledgeItem.active == True,
                )
                .all()
            )

            # Re-run current deterministic rules
            fresh_findings = run_deterministic_checks(rev.content, active_items)

            # Fetch original recorded deterministic findings
            original_findings = (
                db.query(Finding)
                .filter(
                    Finding.review_id == rev.id,
                    Finding.source_type == "rule",
                )
                .all()
            )

            orig_count = len(original_findings)
            fresh_count = len(fresh_findings)
            drift = orig_count != fresh_count
            if drift:
                drift_detected += 1

            replay_results.append({
                "review_id": rev.id,
                "brand_id": rev.brand_id,
                "version_number": rev.version_number,
                "original_rule_findings": orig_count,
                "current_rule_findings": fresh_count,
                "drift": drift,
            })

        return {
            "total_replayed": len(reviews),
            "drift_detected_count": drift_detected,
            "reviews": replay_results,
        }


def main():
    parser = argparse.ArgumentParser(
        description="Inkloom Guardian Automated Rule Regression Suite"
    )
    parser.add_argument(
        "--fixture",
        type=str,
        default=None,
        help="Path to synthetic test fixture JSON",
    )
    parser.add_argument(
        "--replay",
        action="store_true",
        help="Replay recent historical reviews from database against current rules",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Maximum historical reviews to replay",
    )

    args = parser.parse_args()

    fixture_path = Path(args.fixture) if args.fixture else None
    logger.info("=" * 68)
    logger.info("   INKLOOM GUARDIAN - AUTOMATED RULE REGRESSION SUITE")
    logger.info("=" * 68)

    suite_summary = run_regression_suite(fixture_path)
    
    for res in suite_summary["results"]:
        status_tag = "[PASS]" if res["passed"] else "[FAIL]"
        logger.info(f"{status_tag} {res['id']}: {res['name']}")
        if not res["passed"]:
            for err in res["errors"]:
                logger.info(f"       -> ERROR: {err}")

    logger.info("-" * 68)
    logger.info(
        f"Summary: {suite_summary['passed']}/{suite_summary['total']} passed, "
        f"{suite_summary['failed']} failed."
    )

    if args.replay:
        logger.info("\n--- Replaying Historical Reviews (Drift Detection) ---")
        try:
            replay_summary = replay_historical_reviews(limit=args.limit)
            logger.info(f"Replayed: {replay_summary.get('total_replayed', 0)} reviews")
            logger.info(f"Rule Drift Detected: {replay_summary.get('drift_detected_count', 0)} reviews")
            for rev_info in replay_summary.get("reviews", []):
                drift_str = "DRIFT" if rev_info["drift"] else "MATCH"
                logger.info(
                    f"  Review {rev_info['review_id'][:8]} (v{rev_info['version_number']}): "
                    f"Orig={rev_info['original_rule_findings']} vs Fresh={rev_info['current_rule_findings']} [{drift_str}]"
                )
        except Exception as e:
            logger.error(f"Replay failed: {e}")

    logger.info("=" * 68)
    sys.exit(0 if suite_summary["success"] else 1)


if __name__ == "__main__":
    main()
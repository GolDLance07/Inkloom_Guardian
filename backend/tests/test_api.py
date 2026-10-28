import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_health():
    with TestClient(app) as client:
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["rules_engine"] == "active"


def test_brand_lifecycle_and_review_flow():
    with TestClient(app) as client:
        # 1. Create a custom brand (Brand X)
        brand_resp = client.post(
            "/api/v1/brands",
            json={
                "name": "Apex Cloud Systems",
                "description": "Enterprise cloud infrastructure",
                "industry": "Cloud Computing",
                "visual_config": {"primary_color": "#00FFCC"},
            },
        )
        assert brand_resp.status_code == 201
        brand = brand_resp.json()
        brand_id = brand["id"]
        assert brand["name"] == "Apex Cloud Systems"

        # 2. Add knowledge item: Prohibited Term
        k_resp = client.post(
            f"/api/v1/brands/{brand_id}/knowledge",
            json={
                "kind": "prohibited_term",
                "title": "Unsubstantiated 100% Uptime Claim",
                "content": "100% unbreakable uptime",
                "source_label": "SLA Guideline v2",
                "active": True,
                "rule_config": {
                    "replacement": "industry-leading 99.99% high availability SLA"
                },
            },
        )
        assert k_resp.status_code == 201

        # 3. Add knowledge item: Preferred Term
        k_resp2 = client.post(
            f"/api/v1/brands/{brand_id}/knowledge",
            json={
                "kind": "preferred_term",
                "title": "Canonical Cloud Compute Term",
                "content": "Elastic Compute Instances",
                "source_label": "Product Taxonomy 2025",
                "active": True,
                "rule_config": {
                    "disallowed": ["virtual server boxes", "cloud boxes"]
                },
            },
        )
        assert k_resp2.status_code == 201

        # 4. Review text that contains prohibited term and non-standard terminology
        draft_text = "Apex Cloud Systems delivers 100% unbreakable uptime for all your cloud boxes with zero outages."
        rev_resp = client.post(
            "/api/v1/reviews",
            json={
                "brand_id": brand_id,
                "title": "Q3 Launch Announcement",
                "content": draft_text,
                "run_ai": False,
            },
        )
        assert rev_resp.status_code == 201
        review = rev_resp.json()
        assert review["brand_id"] == brand_id
        assert review["summary"]["total"] >= 2
        assert review["summary"]["critical"] >= 1
        assert any(f["category"] == "prohibited_term" for f in review["findings"])
        assert any(f["category"] == "terminology" for f in review["findings"])

        # 5. Record human decision
        review_id = review["id"]
        dec_resp = client.post(
            f"/api/v1/reviews/{review_id}/decisions",
            json={
                "decision": "needs_changes",
                "reviewer_label": "Senior Brand Lead",
                "note": "Please update uptime SLA to 99.99% and use Elastic Compute Instances.",
            },
        )
        assert dec_resp.status_code == 201
        decision = dec_resp.json()
        assert decision["decision"] == "needs_changes"

        # 6. Verify brand isolation with Brand Y: Brand Y must NOT trigger Brand X's rules
        brand_y_resp = client.post(
            "/api/v1/brands",
            json={"name": "BioHealth Global"},
        )
        brand_y = brand_y_resp.json()
        rev_y_resp = client.post(
            "/api/v1/reviews",
            json={
                "brand_id": brand_y["id"],
                "title": "BioHealth Update",
                "content": draft_text,
                "run_ai": False,
            },
        )
        assert rev_y_resp.status_code == 201
        rev_y = rev_y_resp.json()
        # Brand Y has no rules yet, so 0 findings
        assert rev_y["summary"]["total"] == 0

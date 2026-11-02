import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_brand_validation_empty_or_whitespace_name():
    with TestClient(app) as client:
        # Empty string
        resp = client.post("/api/v1/brands", json={"name": ""})
        assert resp.status_code == 422

        # Whitespace-only string
        resp2 = client.post("/api/v1/brands", json={"name": "    "})
        assert resp2.status_code == 422


def test_knowledge_validation_empty_fields_and_invalid_kind():
    with TestClient(app) as client:
        # Use existing demo brand
        b_resp = client.get("/api/v1/brands")
        assert b_resp.status_code == 200
        brand_id = b_resp.json()[0]["id"]

        # Invalid kind
        resp = client.post(
            f"/api/v1/brands/{brand_id}/knowledge",
            json={
                "kind": "unsupported_kind",
                "title": "Valid Title",
                "content": "Valid Content",
                "source_label": "Valid Source",
            },
        )
        assert resp.status_code == 422
        assert "Invalid kind" in str(resp.json())

        # Whitespace-only content
        resp2 = client.post(
            f"/api/v1/brands/{brand_id}/knowledge",
            json={
                "kind": "prohibited_term",
                "title": "Valid Title",
                "content": "   ",
                "source_label": "Valid Source",
            },
        )
        assert resp2.status_code == 422


def test_knowledge_validation_malformed_regex():
    with TestClient(app) as client:
        b_resp = client.get("/api/v1/brands")
        assert b_resp.status_code == 200
        brand_id = b_resp.json()[0]["id"]

        # Malformed regex in conflict_patterns: unclosed bracket '[a-'
        resp = client.post(
            f"/api/v1/brands/{brand_id}/knowledge",
            json={
                "kind": "fact",
                "title": "Malformed Regex Test",
                "content": "Certified metric",
                "source_label": "Compliance Spec",
                "rule_config": {
                    "conflict_patterns": ["[a-"]
                },
            },
        )
        assert resp.status_code == 422
        assert "Invalid regex pattern" in str(resp.json())


def test_review_validation_whitespace_only():
    with TestClient(app) as client:
        b_resp = client.get("/api/v1/brands")
        assert b_resp.status_code == 200
        brand_id = b_resp.json()[0]["id"]

        resp = client.post(
            "/api/v1/reviews",
            json={
                "brand_id": brand_id,
                "title": "Test Whitespace",
                "content": "   \n\t  ",
            },
        )
        assert resp.status_code in (400, 422)


def test_decision_validation_and_idempotency():
    with TestClient(app) as client:
        b_resp = client.get("/api/v1/brands")
        assert b_resp.status_code == 200
        brand_id = b_resp.json()[0]["id"]

        # Create valid review
        rev_resp = client.post(
            "/api/v1/reviews",
            json={
                "brand_id": brand_id,
                "title": "Idempotency Test Review",
                "content": "Content to review for compliance.",
                "run_ai": False,
            },
        )
        assert rev_resp.status_code == 201
        review_id = rev_resp.json()["id"]

        # 1. Invalid verdict
        dec_invalid = client.post(
            f"/api/v1/reviews/{review_id}/decisions",
            json={"decision": "maybe", "reviewer_label": "QA"},
        )
        assert dec_invalid.status_code in (400, 422)

        # 2. Valid verdict
        dec_1 = client.post(
            f"/api/v1/reviews/{review_id}/decisions",
            json={"decision": "approved", "reviewer_label": "QA Officer", "note": "All good"},
        )
        assert dec_1.status_code == 201
        dec_1_data = dec_1.json()

        # 3. Rapid duplicate submission (simulating double click)
        dec_2 = client.post(
            f"/api/v1/reviews/{review_id}/decisions",
            json={"decision": "approved", "reviewer_label": "QA Officer", "note": "All good"},
        )
        assert dec_2.status_code in (200, 201)
        dec_2_data = dec_2.json()
        assert dec_1_data["id"] == dec_2_data["id"]


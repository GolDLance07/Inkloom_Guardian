import io
import pytest
from unittest.mock import patch
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.db import SessionLocal
from app.models.base import Brand, KnowledgeItem


def create_test_image_bytes(width: int = 200, height: int = 100, format: str = "PNG") -> bytes:
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


def test_asset_inspection_invalid_format():
    with TestClient(app) as client:
        # 1. Create a test brand
        b_res = client.post("/api/v1/brands", json={"name": "Asset Test Brand 1"})
        brand_id = b_res.json()["id"]

        # 2. Upload invalid text file disguised as image
        files = {"file": ("malicious.txt", b"not an image", "text/plain")}
        resp = client.post(f"/api/v1/brands/{brand_id}/assets/inspect-image", files=files)
        assert resp.status_code == 400
        assert "unsupported image format" in resp.json()["detail"].lower()


def test_asset_inspection_corrupt_file():
    with TestClient(app) as client:
        b_res = client.post("/api/v1/brands", json={"name": "Asset Test Brand 2"})
        brand_id = b_res.json()["id"]

        files = {"file": ("corrupt.png", b"\x89PNG\r\n\x1a\ncorruptdata", "image/png")}
        resp = client.post(f"/api/v1/brands/{brand_id}/assets/inspect-image", files=files)
        assert resp.status_code == 400
        assert "corrupt" in resp.json()["detail"].lower()


def test_asset_inspection_oversized_dimensions():
    with TestClient(app) as client:
        b_res = client.post("/api/v1/brands", json={"name": "Asset Test Brand 3"})
        brand_id = b_res.json()["id"]

        # 4097x100 exceeds MAX_DIMENSION (4096)
        img_bytes = create_test_image_bytes(width=4097, height=100)
        files = {"file": ("oversized.png", img_bytes, "image/png")}
        resp = client.post(f"/api/v1/brands/{brand_id}/assets/inspect-image", files=files)
        assert resp.status_code == 400
        assert "exceed maximum" in resp.json()["detail"].lower()


def test_asset_inspection_graceful_ocr_handling_and_brand_isolation():
    with TestClient(app) as client:
        # Create Brand A
        b_res = client.post("/api/v1/brands", json={"name": "HealthCorp Alpha"})
        brand_a_id = b_res.json()["id"]

        # Add prohibited term for Brand A
        client.post(
            f"/api/v1/brands/{brand_a_id}/knowledge",
            json={
                "kind": "prohibited_term",
                "title": "Restricted FDA claim",
                "content": "guaranteed 100% cure",
                "source_label": "Pharma Policy",
                "active": True,
                "rule_config": {"replacement": "clinically studied formulation"},
            },
        )

        img_bytes = create_test_image_bytes(width=300, height=150)
        files = {"file": ("banner.png", img_bytes, "image/png")}

        # Test case 1: OCR engine is unavailable or returns no text
        resp = client.post(f"/api/v1/brands/{brand_a_id}/assets/inspect-image", files=files)
        assert resp.status_code == 200
        data = resp.json()
        assert data["brand_id"] == brand_a_id
        assert data["processing_status"] in ("ocr_unavailable", "no_text_detected", "success")
        assert "advisory" in data["limitations"].lower()

        # Test case 2: Mock OCR text detection with prohibited claim
        with patch("app.services.asset_checker.extract_ocr_text") as mock_ocr:
            mock_ocr.return_value = (
                "Introducing our new elixir: guaranteed 100% cure for fatigue.",
                92.5,
                "success",
            )
            resp2 = client.post(f"/api/v1/brands/{brand_a_id}/assets/inspect-image", files=files)
            assert resp2.status_code == 200
            data2 = resp2.json()
            assert data2["processing_status"] == "success"
            assert data2["ocr_confidence"] == 92.5
            assert len(data2["findings"]) >= 1
            assert any(f["category"] == "prohibited_term" for f in data2["findings"])

            # Test brand isolation: inspect same asset under Brand B
            b_b_res = client.post("/api/v1/brands", json={"name": "Tech Corp Beta"})
            brand_b_id = b_b_res.json()["id"]

            resp_b = client.post(f"/api/v1/brands/{brand_b_id}/assets/inspect-image", files=files)
            assert resp_b.status_code == 200
            data_b = resp_b.json()
            # Brand B does not have Brand A's rules
            assert len(data_b["findings"]) == 0


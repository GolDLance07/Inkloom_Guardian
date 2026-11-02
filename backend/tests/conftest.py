import pytest
from app.db import SessionLocal
from app.models.base import Brand

KEEP_SLUGS = {"acme-enterprise-core", "novaglow-skincare"}


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_brands_after_session():
    """Ensure any test-generated brands are cleaned up when the pytest session finishes."""
    yield
    try:
        with SessionLocal() as db:
            brands_to_delete = (
                db.query(Brand)
                .filter(~Brand.slug.in_(KEEP_SLUGS))
                .all()
            )
            for b in brands_to_delete:
                db.delete(b)
            db.commit()
    except Exception:
        pass


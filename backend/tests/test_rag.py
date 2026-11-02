import uuid
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.db import SessionLocal, init_db
from app.models.base import Brand, KnowledgeItem, KnowledgeEmbedding
from app.services.embedding_service import (
    retrieve_relevant_knowledge,
    lexical_rank_items,
    reindex_all_knowledge,
    generate_and_store_embedding,
)
from app.services.review_service import execute_review


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()


def test_deterministic_checks_unaffected_by_rag_or_credentials():
    """Verify that deterministic rules always evaluate 100% of active knowledge items."""
    with SessionLocal() as db:
        unique_id = uuid.uuid4().hex[:8]
        brand = Brand(name=f"Deterministic RAG Test Brand {unique_id}", slug=f"det-rag-{unique_id}")
        db.add(brand)
        db.commit()
        db.refresh(brand)

        # Add 15 knowledge items (more than the limit=10 for AI)
        for i in range(15):
            k = KnowledgeItem(
                brand_id=brand.id,
                kind="prohibited_term" if i % 2 == 0 else "preferred_term",
                title=f"Rule item {i}",
                content=f"forbidden_phrase_{i}",
                source_label="Compliance Manual",
                active=True,
                rule_config={"replacement": f"approved_phrase_{i}"} if i % 2 == 0 else {"disallowed": [f"forbidden_phrase_{i}"]},
            )
            db.add(k)
        db.commit()

        # Draft containing all 15 forbidden phrases
        draft_content = " ".join(f"Testing forbidden_phrase_{i}" for i in range(15))

        # Run review without AI (run_ai=False)
        import asyncio
        review = asyncio.run(execute_review(
            db=db,
            brand_id=brand.id,
            title="Full Coverage Draft",
            content=draft_content,
            run_ai=False,
        ))

        # Every single rule item must trigger a finding
        rule_findings = [f for f in review.findings if f.source_type == "rule"]
        assert len(rule_findings) == 15, f"Expected all 15 deterministic rules to fire, got {len(rule_findings)}"


def test_lexical_fallback_and_inactive_exclusion():
    """Verify lexical fallback ranks items by relevance and strictly excludes inactive items."""
    with SessionLocal() as db:
        uid = uuid.uuid4().hex[:8]
        brand = Brand(name=f"Lexical Fallback Test {uid}", slug=f"lex-fallback-{uid}")
        db.add(brand)
        db.commit()
        db.refresh(brand)

        # Active item relevant to 'quantum'
        k_active = KnowledgeItem(
            brand_id=brand.id,
            kind="fact",
            title="Quantum Encryption Core",
            content="Our hardware supports quantum-resistant lattice cryptography.",
            source_label="Security Doc",
            active=True,
        )
        db.add(k_active)

        # Inactive item also mentioning 'quantum'
        k_inactive = KnowledgeItem(
            brand_id=brand.id,
            kind="fact",
            title="Deprecated Quantum Processor",
            content="Old quantum processor architecture v1.",
            source_label="Legacy Security",
            active=False,
        )
        db.add(k_inactive)
        db.commit()

        # Query text targeting 'quantum'
        items, mode = retrieve_relevant_knowledge(
            db=db,
            brand_id=brand.id,
            query_text="Announcing our quantum cryptographic security suite.",
            limit=5,
        )

        assert any(it.id == k_active.id for it in items)
        # Inactive item MUST NOT be retrieved
        assert not any(it.id == k_inactive.id for it in items)


def test_brand_isolation_in_retrieval():
    """Verify that retrieval strictly returns items belonging to the requested brand."""
    with SessionLocal() as db:
        uid = uuid.uuid4().hex[:8]
        brand_a = Brand(name=f"Brand Isolation A {uid}", slug=f"brand-iso-a-{uid}")
        brand_b = Brand(name=f"Brand Isolation B {uid}", slug=f"brand-iso-b-{uid}")
        db.add_all([brand_a, brand_b])
        db.commit()

        k_a = KnowledgeItem(
            brand_id=brand_a.id,
            kind="guideline",
            title="Brand A Secret Sauce",
            content="Proprietary algorithm X for Brand A.",
            source_label="Brand A Internal",
            active=True,
        )
        k_b = KnowledgeItem(
            brand_id=brand_b.id,
            kind="guideline",
            title="Brand B Secret Sauce",
            content="Proprietary algorithm Y for Brand B.",
            source_label="Brand B Internal",
            active=True,
        )
        db.add_all([k_a, k_b])
        db.commit()

        # Query Brand A
        items_a, _ = retrieve_relevant_knowledge(
            db=db,
            brand_id=brand_a.id,
            query_text="Proprietary algorithm details and secret sauce",
            limit=5,
        )

        assert all(it.brand_id == brand_a.id for it in items_a)
        assert not any(it.brand_id == brand_b.id for it in items_a)


def test_vector_retrieval_flow_with_mock():
    """Verify vector search retrieval path and ranking when embeddings are available."""
    with SessionLocal() as db:
        uid = uuid.uuid4().hex[:8]
        brand = Brand(name=f"Vector Mock Brand {uid}", slug=f"vec-mock-{uid}")
        db.add(brand)
        db.commit()

        k1 = KnowledgeItem(
            brand_id=brand.id,
            kind="fact",
            title="Solar Panel Efficiency",
            content="Our solar panels achieve 24.5% photovoltaic efficiency.",
            source_label="CleanTech Spec",
            active=True,
        )
        k2 = KnowledgeItem(
            brand_id=brand.id,
            kind="fact",
            title="Wind Turbine Capacity",
            content="Offshore wind turbines deliver 15MW rated power.",
            source_label="CleanTech Spec",
            active=True,
        )
        db.add_all([k1, k2])
        db.commit()

        # Mock query and item embeddings
        dummy_vec1 = [0.1] * 768
        dummy_vec2 = [0.9] * 768

        with patch("app.services.embedding_service.generate_embedding") as mock_emb:
            # Query will produce dummy_vec1
            mock_emb.return_value = dummy_vec1

            # Store embeddings
            emb1 = KnowledgeEmbedding(
                knowledge_item_id=k1.id,
                brand_id=brand.id,
                embedding=dummy_vec1,
                model_version="text-embedding-004",
            )
            emb2 = KnowledgeEmbedding(
                knowledge_item_id=k2.id,
                brand_id=brand.id,
                embedding=dummy_vec2,
                model_version="text-embedding-004",
            )
            db.add_all([emb1, emb2])
            db.commit()

            items, mode = retrieve_relevant_knowledge(
                db=db,
                brand_id=brand.id,
                query_text="What is the solar photovoltaic efficiency?",
                limit=1,
            )

            assert len(items) == 1
            assert items[0].id == k1.id
            assert mode in ("vector", "all")


def test_reindex_all_knowledge_idempotent():
    """Verify that reindex_all_knowledge runs idempotently without error."""
    with SessionLocal() as db:
        uid = uuid.uuid4().hex[:8]
        brand = Brand(name=f"Reindex Brand {uid}", slug=f"reindex-{uid}")
        db.add(brand)
        db.commit()

        k = KnowledgeItem(
            brand_id=brand.id,
            kind="fact",
            title="Reindex Test Fact",
            content="Test fact content for reindexing verification.",
            source_label="Docs",
            active=True,
        )
        db.add(k)
        db.commit()

        # Run reindex with dummy embedding mock
        with patch("app.services.embedding_service.generate_embedding") as mock_emb:
            mock_emb.return_value = [0.05] * 768
            res = reindex_all_knowledge(db, brand_id=brand.id)
            assert res["created_embeddings"] >= 1

            # Second run should update or skip, not duplicate
            res2 = reindex_all_knowledge(db, brand_id=brand.id)
            assert res2["created_embeddings"] == 0
            assert res2["updated_embeddings"] >= 1

import argparse
import logging
import math
import re
from typing import List, Dict, Any, Optional, Tuple, Set
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.models.base import KnowledgeItem, KnowledgeEmbedding, utc_now

logger = logging.getLogger("embedding_service")


def generate_embedding(content: str) -> Optional[List[float]]:
    """
    Calls the configured embedding provider (Gemini text-embedding-004) to obtain
    a 768-dimensional dense vector representation.
    Fails safely with None on missing keys, network timeouts, or quota limits.
    """
    if not settings.LLM_API_KEY:
        return None

    model = settings.EMBEDDING_MODEL or "text-embedding-004"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent?key={settings.LLM_API_KEY}"

    # Truncate content to safe char bounds for embedding input
    safe_text = content.strip()[:2048]
    if not safe_text:
        return None

    payload = {
        "content": {
            "parts": [{"text": safe_text}]
        }
    }

    try:
        timeout_sec = min(settings.LLM_TIMEOUT_SECONDS, 10)
        with httpx.Client(timeout=timeout_sec) as client:
            resp = client.post(url, json=payload)
            if resp.status_code != 200:
                logger.warning(
                    f"Embedding API returned status {resp.status_code}: {resp.text[:200]}"
                )
                return None
            data = resp.json()
            embedding_vals = data.get("embedding", {}).get("values", [])
            if isinstance(embedding_vals, list) and len(embedding_vals) == 768:
                return [float(x) for x in embedding_vals]
            else:
                logger.warning(
                    f"Embedding response dimension mismatch: expected 768, got {len(embedding_vals)}"
                )
                return None
    except Exception as e:
        logger.warning(f"Embedding request failed: {repr(e)}")
        return None


def generate_and_store_embedding(
    db: Session, item: KnowledgeItem
) -> Optional[KnowledgeEmbedding]:
    """
    Generates and stores or updates the pgvector embedding for a single knowledge item.
    """
    if not item.active:
        return None

    text_to_embed = f"{item.title}\n{item.kind}\n{item.content}\n{item.source_label}"
    vec = generate_embedding(text_to_embed)
    if not vec:
        return None

    try:
        existing = (
            db.query(KnowledgeEmbedding)
            .filter(KnowledgeEmbedding.knowledge_item_id == item.id)
            .first()
        )

        if existing:
            existing.embedding = vec
            existing.model_version = settings.EMBEDDING_MODEL
            existing.updated_at = utc_now()
            db.flush()
            return existing
        else:
            new_embedding = KnowledgeEmbedding(
                knowledge_item_id=item.id,
                brand_id=item.brand_id,
                embedding=vec,
                model_version=settings.EMBEDDING_MODEL,
            )
            db.add(new_embedding)
            db.flush()
            return new_embedding
    except Exception as e:
        logger.error(f"Failed to persist embedding for knowledge item {item.id}: {e}")
        return None


def tokenize(text_input: str) -> Set[str]:
    """Tokenize text into lowercase alphanumeric terms for lexical matching."""
    if not text_input:
        return set()
    words = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text_input.lower())
    return set(words)


def compute_lexical_score(query_tokens: Set[str], query_lower: str, item: KnowledgeItem) -> float:
    """Calculate token overlap and phrase presence score for lexical ranking."""
    item_text = f"{item.title} {item.content} {item.normalized_value or ''}".lower()
    item_tokens = tokenize(item_text)

    if not query_tokens or not item_tokens:
        return 0.0

    intersection = query_tokens.intersection(item_tokens)
    union = query_tokens.union(item_tokens)
    jaccard = len(intersection) / len(union) if union else 0.0

    # Phrase match bonus
    bonus = 0.0
    if item.content.lower() in query_lower:
        bonus += 0.5
    if item.title.lower() in query_lower:
        bonus += 0.3

    # Add extra weight if rule aliases match
    if item.rule_config:
        for alias in item.rule_config.get("aliases", []):
            if alias.lower() in query_lower:
                bonus += 0.4
        for disallowed in item.rule_config.get("disallowed", []):
            if disallowed.lower() in query_lower:
                bonus += 0.4

    return jaccard + bonus


def lexical_rank_items(query_text: str, items: List[KnowledgeItem]) -> List[KnowledgeItem]:
    """Ranks knowledge items by lexical similarity to the draft content."""
    query_tokens = tokenize(query_text)
    query_lower = query_text.lower()

    scored = [
        (compute_lexical_score(query_tokens, query_lower, it), it)
        for it in items
    ]
    # Sort descending by score
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [it for _, it in scored]


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculate cosine similarity between two float vectors in Python."""
    if len(v1) != len(v2) or not v1:
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot / (norm1 * norm2)


def retrieve_relevant_knowledge(
    db: Session,
    brand_id: str,
    query_text: str,
    limit: int = 10,
) -> Tuple[List[KnowledgeItem], str]:
    """
    Retrieves the most relevant active brand knowledge subset for AI review context.
    
    Guarantees:
    - Strictly scoped to brand_id in DB query.
    - Excludes inactive and deleted items.
    - Uses pgvector cosine similarity if available and configured.
    - Automatically falls back to lexical matching if embeddings or vector search fail.
    - Never reduces deterministic rule check coverage (used strictly for AI prompt bounds).
    """
    # 1. Fetch active items for the brand
    active_items = (
        db.query(KnowledgeItem)
        .filter(
            KnowledgeItem.brand_id == brand_id,
            KnowledgeItem.active == True,
        )
        .all()
    )

    if not active_items:
        return [], "none"

    # If active items are fewer than or equal to the limit, return all directly
    if len(active_items) <= limit:
        return active_items, "all"

    # 2. Attempt Vector Retrieval
    query_vec = generate_embedding(query_text)
    if query_vec:
        try:
            is_postgres = db.bind.dialect.name == "postgresql"
            if is_postgres:
                # Use native pgvector cosine distance operator
                ranked_items = (
                    db.query(KnowledgeItem)
                    .join(KnowledgeEmbedding, KnowledgeItem.id == KnowledgeEmbedding.knowledge_item_id)
                    .filter(
                        KnowledgeItem.brand_id == brand_id,
                        KnowledgeItem.active == True,
                    )
                    .order_by(KnowledgeEmbedding.embedding.cosine_distance(query_vec))
                    .limit(limit)
                    .all()
                )
            else:
                # SQLite fallback: load embeddings for active items and rank in Python
                embeddings = (
                    db.query(KnowledgeEmbedding)
                    .join(KnowledgeItem, KnowledgeItem.id == KnowledgeEmbedding.knowledge_item_id)
                    .filter(
                        KnowledgeEmbedding.brand_id == brand_id,
                        KnowledgeItem.active == True,
                    )
                    .all()
                )
                scored = []
                for emb in embeddings:
                    if emb.embedding is not None and emb.knowledge_item:
                        score = cosine_similarity(query_vec, list(emb.embedding))
                        scored.append((score, emb.knowledge_item))
                scored.sort(key=lambda p: p[0], reverse=True)
                ranked_items = [it for _, it in scored[:limit]]

            # Enforce brand isolation and active guard in memory
            valid_items = [
                it for it in ranked_items
                if it.brand_id == brand_id and it.active
            ]
            if valid_items:
                return valid_items, "vector"
        except Exception as e:
            logger.warning(f"Vector search failed, falling back to lexical retrieval: {e}")

    # 3. Lexical Fallback
    lexical_ranked = lexical_rank_items(query_text, active_items)
    selected = lexical_ranked[:limit]
    return selected, "lexical_fallback"


def reindex_all_knowledge(
    db: Session, brand_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Idempotent CLI / backfill command to index all active knowledge items.
    """
    query = db.query(KnowledgeItem).filter(KnowledgeItem.active == True)
    if brand_id:
        query = query.filter(KnowledgeItem.brand_id == brand_id)

    items = query.all()
    created = 0
    updated = 0
    failed = 0

    for it in items:
        emb = (
            db.query(KnowledgeEmbedding)
            .filter(KnowledgeEmbedding.knowledge_item_id == it.id)
            .first()
        )
        stored = generate_and_store_embedding(db, it)
        if stored:
            if emb:
                updated += 1
            else:
                created += 1
        else:
            failed += 1

    db.commit()
    return {
        "total_active_items": len(items),
        "created_embeddings": created,
        "updated_embeddings": updated,
        "failed_or_skipped": failed,
    }


def main():
    parser = argparse.ArgumentParser(description="Inkloom Knowledge Base Embedding Indexer")
    subparsers = parser.add_subparsers(dest="command")

    reindex_cmd = subparsers.add_parser("reindex", help="Reindex active knowledge items")
    reindex_cmd.add_argument("--brand-id", type=str, default=None, help="Filter to specific brand")

    args = parser.parse_args()

    if args.command == "reindex":
        from app.db import SessionLocal
        logging.basicConfig(level=logging.INFO)
        with SessionLocal() as db:
            logger.info("Starting knowledge embedding reindex...")
            res = reindex_all_knowledge(db, brand_id=args.brand_id)
            logger.info(f"Reindex complete: {res}")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()


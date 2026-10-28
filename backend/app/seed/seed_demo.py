import os
import json
from pathlib import Path
from sqlalchemy.orm import Session
from app.db import SessionLocal, init_db
from app.models.base import Brand, KnowledgeItem
from app.config import settings


def seed_demo_data(db: Session = None):
    close_after = False
    if db is None:
        init_db()
        db = SessionLocal()
        close_after = True

    try:
        fixture_path = Path(__file__).parent / "demo_brand.json"
        if not fixture_path.exists():
            print("Demo fixture file not found, skipping seed.")
            return

        with open(fixture_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        brand_data = data.get("brand", {})
        slug = brand_data.get("slug")
        if not slug:
            return

        brand = db.query(Brand).filter(Brand.slug == slug).first()
        if not brand:
            brand = Brand(
                name=brand_data["name"],
                slug=slug,
                description=brand_data.get("description"),
                industry=brand_data.get("industry"),
                logo_url=brand_data.get("logo_url"),
                visual_config=brand_data.get("visual_config", {}),
                is_demo=True,
            )
            db.add(brand)
            db.flush()
            print(f"Created demo brand: {brand.name} ({brand.id})")
        else:
            brand.name = brand_data["name"]
            brand.description = brand_data.get("description")
            brand.industry = brand_data.get("industry")
            brand.visual_config = brand_data.get("visual_config", {})
            db.flush()
            print(f"Updated existing demo brand: {brand.name}")

        # Seed knowledge items for this brand only
        items_data = data.get("knowledge_items", [])
        for item_dict in items_data:
            existing = db.query(KnowledgeItem).filter(
                KnowledgeItem.brand_id == brand.id,
                KnowledgeItem.title == item_dict["title"],
            ).first()

            if not existing:
                k_item = KnowledgeItem(
                    brand_id=brand.id,
                    kind=item_dict["kind"],
                    title=item_dict["title"],
                    content=item_dict["content"],
                    normalized_value=item_dict.get("normalized_value"),
                    source_label=item_dict["source_label"],
                    active=item_dict.get("active", True),
                    rule_config=item_dict.get("rule_config", {}),
                    extra_metadata=item_dict.get("metadata", {}),
                )
                db.add(k_item)
                print(f"Added knowledge item: {k_item.title}")
            else:
                existing.content = item_dict["content"]
                existing.normalized_value = item_dict.get("normalized_value")
                existing.source_label = item_dict["source_label"]
                existing.rule_config = item_dict.get("rule_config", {})
                existing.extra_metadata = item_dict.get("metadata", {})

        db.commit()
        print("Demo data seeded successfully.")
    finally:
        if close_after:
            db.close()


if __name__ == "__main__":
    seed_demo_data()

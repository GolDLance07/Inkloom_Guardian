import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class Brand(Base):
    __tablename__ = "brands"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True)
    logo_url = Column(Text, nullable=True)
    visual_config = Column(JSON, nullable=False, default=dict)
    is_demo = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

    knowledge_items = relationship("KnowledgeItem", back_populates="brand", cascade="all, delete-orphan")
    review_groups = relationship("ReviewGroup", back_populates="brand", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="brand", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="brand", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="brand", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="brand", cascade="all, delete-orphan")


class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    normalized_value = Column(String(255), nullable=True)
    source_label = Column(String(255), nullable=False)
    active = Column(Boolean, nullable=False, default=True)
    rule_config = Column(JSON, nullable=False, default=dict)
    extra_metadata = Column("metadata", JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

    brand = relationship("Brand", back_populates="knowledge_items")
    findings = relationship("Finding", back_populates="knowledge_item")


class ReviewGroup(Base):
    __tablename__ = "review_groups"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    brand = relationship("Brand", back_populates="review_groups")
    reviews = relationship("Review", back_populates="review_group", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    review_group_id = Column(String(36), ForeignKey("review_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    engine_status = Column(String(50), nullable=False, default="rules_only")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    brand = relationship("Brand", back_populates="reviews")
    review_group = relationship("ReviewGroup", back_populates="reviews")
    findings = relationship("Finding", back_populates="review", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="review", cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    review_id = Column(String(36), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    knowledge_item_id = Column(String(36), ForeignKey("knowledge_items.id", ondelete="SET NULL"), nullable=True, index=True)
    source_type = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)
    claim_status = Column(String(50), nullable=True)
    title = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    content_excerpt = Column(Text, nullable=True)
    suggested_rewrite = Column(Text, nullable=True)
    location_start = Column(Integer, nullable=True)
    location_end = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    review = relationship("Review", back_populates="findings")
    brand = relationship("Brand", back_populates="findings")
    knowledge_item = relationship("KnowledgeItem", back_populates="findings")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    review_id = Column(String(36), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    decision = Column(String(50), nullable=False)
    reviewer_label = Column(String(100), nullable=False, default="Demo reviewer")
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    review = relationship("Review", back_populates="decisions")
    brand = relationship("Brand", back_populates="decisions")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    review_id = Column(String(36), ForeignKey("reviews.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False)
    details = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    brand = relationship("Brand", back_populates="audit_events")

from pydantic import BaseModel, Field, ConfigDict, AliasChoices
from typing import Optional, List, Dict, Any
from datetime import datetime


class VisualConfig(BaseModel):
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = None


class BrandBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    visual_config: Dict[str, Any] = Field(default_factory=dict)


class BrandCreate(BrandBase):
    slug: Optional[str] = None


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    visual_config: Optional[Dict[str, Any]] = None


class BrandResponse(BrandBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    is_demo: bool
    created_at: datetime
    updated_at: datetime


class KnowledgeItemBase(BaseModel):
    kind: str = Field(..., description="guideline, fact, claim, preferred_term, prohibited_term, required_phrase, disclaimer, asset_reference")
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    normalized_value: Optional[str] = None
    source_label: str = Field(..., min_length=1, max_length=255)
    active: bool = True
    rule_config: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict, validation_alias=AliasChoices("metadata", "extra_metadata"))


class KnowledgeItemCreate(KnowledgeItemBase):
    pass


class KnowledgeItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    normalized_value: Optional[str] = None
    source_label: Optional[str] = None
    active: Optional[bool] = None
    rule_config: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class KnowledgeItemResponse(KnowledgeItemBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    brand_id: str
    metadata: Dict[str, Any] = Field(default_factory=dict, validation_alias="extra_metadata")
    created_at: datetime
    updated_at: datetime


class FindingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    review_id: str
    brand_id: str
    knowledge_item_id: Optional[str] = None
    source_type: str
    category: str
    severity: str
    claim_status: Optional[str] = None
    title: str
    explanation: str
    evidence: Optional[str] = None
    content_excerpt: Optional[str] = None
    suggested_rewrite: Optional[str] = None
    location_start: Optional[int] = None
    location_end: Optional[int] = None
    created_at: datetime


class DecisionCreate(BaseModel):
    decision: str = Field(..., description="approved, needs_changes, rejected")
    reviewer_label: str = Field(default="Demo reviewer", max_length=100)
    note: Optional[str] = None


class DecisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    review_id: str
    brand_id: str
    decision: str
    reviewer_label: str
    note: Optional[str] = None
    created_at: datetime


class ReviewCreate(BaseModel):
    brand_id: str
    review_group_id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    run_ai: bool = True


class FindingsSummary(BaseModel):
    total: int = 0
    critical: int = 0
    warning: int = 0
    info: int = 0
    score: int = 100


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    review_group_id: str
    brand_id: str
    version_number: int
    title: str
    content: str
    engine_status: str
    created_at: datetime
    summary: FindingsSummary
    findings: List[FindingResponse] = []
    latest_decision: Optional[DecisionResponse] = None


class ReviewGroupHistoryItem(BaseModel):
    review_id: str
    version_number: int
    content: str
    engine_status: str
    created_at: datetime
    finding_count: int
    latest_decision: Optional[DecisionResponse] = None


class ReviewGroupHistoryResponse(BaseModel):
    review_group_id: str
    brand_id: str
    title: str
    history: List[ReviewGroupHistoryItem]


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorEnvelope(BaseModel):
    error: ErrorDetail

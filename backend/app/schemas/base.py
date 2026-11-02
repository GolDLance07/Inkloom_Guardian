import re
from pydantic import BaseModel, Field, ConfigDict, AliasChoices, field_validator
from typing import Optional, List, Dict, Any, ClassVar, Set
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

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Brand name cannot be empty or whitespace only.")
        return s


class BrandCreate(BrandBase):
    slug: Optional[str] = None


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    visual_config: Optional[Dict[str, Any]] = None

    @field_validator("name")
    @classmethod
    def validate_update_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            s = v.strip()
            if not s:
                raise ValueError("Brand name cannot be empty or whitespace only.")
            return s
        return v


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

    ALLOWED_KINDS: ClassVar[Set[str]] = {
        "guideline",
        "fact",
        "claim",
        "preferred_term",
        "prohibited_term",
        "required_phrase",
        "disclaimer",
        "asset_reference",
    }

    @field_validator("kind")
    @classmethod
    def validate_kind(cls, v: str) -> str:
        v_clean = v.strip().lower()
        if v_clean not in cls.ALLOWED_KINDS:
            raise ValueError(
                f"Invalid kind '{v}'. Allowed kinds: {', '.join(sorted(cls.ALLOWED_KINDS))}"
            )
        return v_clean

    @field_validator("title", "content", "source_label")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Field cannot be empty or whitespace only.")
        return s

    @field_validator("rule_config")
    @classmethod
    def validate_rule_config(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(v, dict):
            return {}
        patterns = v.get("conflict_patterns")
        if patterns:
            if not isinstance(patterns, list):
                raise ValueError("conflict_patterns must be a list of regex pattern strings.")
            for p in patterns:
                if not isinstance(p, str):
                    raise ValueError(f"Pattern '{p}' must be a string.")
                try:
                    re.compile(p)
                except re.error as e:
                    raise ValueError(f"Invalid regex pattern '{p}': {e}")
        return v


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

    @field_validator("title", "content", "source_label")
    @classmethod
    def validate_update_non_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            s = v.strip()
            if not s:
                raise ValueError("Field cannot be empty or whitespace only.")
            return s
        return v

    @field_validator("rule_config")
    @classmethod
    def validate_update_rule_config(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if v is not None and isinstance(v, dict):
            patterns = v.get("conflict_patterns")
            if patterns:
                if not isinstance(patterns, list):
                    raise ValueError("conflict_patterns must be a list of regex pattern strings.")
                for p in patterns:
                    if not isinstance(p, str):
                        raise ValueError(f"Pattern '{p}' must be a string.")
                    try:
                        re.compile(p)
                    except re.error as e:
                        raise ValueError(f"Invalid regex pattern '{p}': {e}")
        return v


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

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, v: str) -> str:
        d = v.strip().lower()
        if d not in {"approved", "needs_changes", "rejected"}:
            raise ValueError("Decision must be one of: 'approved', 'needs_changes', 'rejected'.")
        return d

    @field_validator("reviewer_label")
    @classmethod
    def validate_reviewer_label(cls, v: str) -> str:
        s = v.strip()
        return s if s else "Demo reviewer"


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

    @field_validator("brand_id")
    @classmethod
    def validate_brand_id(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("brand_id cannot be empty or whitespace only.")
        return s

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Review title cannot be empty or whitespace only.")
        return s

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Review content cannot be empty or whitespace only.")
        return s


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
    retrieval_mode: Optional[str] = None
    created_at: datetime
    summary: FindingsSummary
    findings: List[FindingResponse] = []
    latest_decision: Optional[DecisionResponse] = None


class AssetInspectionResponse(BaseModel):
    brand_id: str
    filename: str
    extracted_text: str
    ocr_confidence: Optional[float] = None
    processing_status: str
    findings: List[Dict[str, Any]] = []
    limitations: str


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

export interface VisualConfig {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  industry?: string | null;
  logo_url?: string | null;
  visual_config: VisualConfig;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandCreate {
  name: string;
  slug?: string;
  description?: string;
  industry?: string;
  logo_url?: string;
  visual_config?: VisualConfig;
}

export interface BrandUpdate {
  name?: string;
  description?: string;
  industry?: string;
  logo_url?: string;
  visual_config?: VisualConfig;
}

export interface KnowledgeItem {
  id: string;
  brand_id: string;
  kind: 'guideline' | 'fact' | 'claim' | 'preferred_term' | 'prohibited_term' | 'required_phrase' | 'disclaimer' | 'asset_reference';
  title: string;
  content: string;
  normalized_value?: string | null;
  source_label: string;
  active: boolean;
  rule_config: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeItemCreate {
  kind: string;
  title: string;
  content: string;
  normalized_value?: string;
  source_label: string;
  active?: boolean;
  rule_config?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Finding {
  id: string;
  review_id: string;
  brand_id: string;
  knowledge_item_id?: string | null;
  source_type: 'rule' | 'ai' | 'system_rule';
  category: string;
  severity: 'critical' | 'warning' | 'info';
  claim_status?: 'supported' | 'contradicted' | 'unverified' | 'not_applicable' | null;
  title: string;
  explanation: string;
  evidence?: string | null;
  content_excerpt?: string | null;
  suggested_rewrite?: string | null;
  location_start?: number | null;
  location_end?: number | null;
  created_at: string;
}

export interface FindingsSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
  score: number;
}

export interface Decision {
  id: string;
  review_id: string;
  brand_id: string;
  decision: 'approved' | 'needs_changes' | 'rejected';
  reviewer_label: string;
  note?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  review_group_id: string;
  brand_id: string;
  version_number: number;
  title: string;
  content: string;
  engine_status: 'rules_only' | 'rules_and_ai' | 'ai_unavailable';
  created_at: string;
  summary: FindingsSummary;
  findings: Finding[];
  latest_decision?: Decision | null;
}

export interface ReviewGroupHistoryItem {
  review_id: string;
  version_number: number;
  content: string;
  engine_status: string;
  created_at: string;
  finding_count: number;
  latest_decision?: Decision | null;
}

export interface ReviewGroupHistory {
  review_group_id: string;
  brand_id: string;
  title: string;
  history: ReviewGroupHistoryItem[];
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  database: string;
  ai_enabled: boolean;
  rules_engine: string;
}

export interface DemoFixture {
  enabled: boolean;
  brand_slug?: string;
  sample_draft?: {
    title: string;
    content: string;
  };
}

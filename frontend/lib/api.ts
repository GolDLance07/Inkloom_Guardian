import {
  Brand,
  BrandCreate,
  BrandUpdate,
  KnowledgeItem,
  KnowledgeItemCreate,
  Review,
  ReviewGroupHistory,
  Decision,
  HealthStatus,
  DemoFixture,
} from './types';

const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_BASE = rawBase.replace(/\/+$/, '');

class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;
      let errorCode = 'REQUEST_FAILED';
      try {
        const errorJson = await response.json();
        if (errorJson.error) {
          errorMsg = errorJson.error.message || errorMsg;
          errorCode = errorJson.error.code || errorCode;
        } else if (errorJson.detail) {
          errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // use default
      }
      throw new ApiError(errorMsg, response.status, errorCode);
    }

    return await response.json() as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network connection failed', 0, 'NETWORK_ERROR');
  }
}

export const api = {
  // System Health
  async getHealth(): Promise<HealthStatus> {
    return request<HealthStatus>('/health');
  },

  // Brands
  async getBrands(includeDemo: boolean = true): Promise<Brand[]> {
    return request<Brand[]>(`/api/v1/brands?include_demo=${includeDemo}`);
  },

  async createBrand(payload: BrandCreate): Promise<Brand> {
    return request<Brand>('/api/v1/brands', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getBrand(brandId: string): Promise<Brand> {
    return request<Brand>(`/api/v1/brands/${brandId}`);
  },

  async updateBrand(brandId: string, payload: BrandUpdate): Promise<Brand> {
    return request<Brand>(`/api/v1/brands/${brandId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Knowledge Items
  async getKnowledge(brandId: string, kind?: string, activeOnly: boolean = false): Promise<KnowledgeItem[]> {
    const params = new URLSearchParams();
    if (kind) params.set('kind', kind);
    if (activeOnly) params.set('active_only', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<KnowledgeItem[]>(`/api/v1/brands/${brandId}/knowledge${query}`);
  },

  async createKnowledgeItem(brandId: string, payload: KnowledgeItemCreate): Promise<KnowledgeItem> {
    return request<KnowledgeItem>(`/api/v1/brands/${brandId}/knowledge`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateKnowledgeItem(brandId: string, itemId: string, payload: Partial<KnowledgeItemCreate>): Promise<KnowledgeItem> {
    return request<KnowledgeItem>(`/api/v1/brands/${brandId}/knowledge/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteKnowledgeItem(brandId: string, itemId: string, permanent: boolean = false): Promise<{ status: string; id: string }> {
    return request<{ status: string; id: string }>(`/api/v1/brands/${brandId}/knowledge/${itemId}?permanent=${permanent}`, {
      method: 'DELETE',
    });
  },

  // Reviews
  async createReview(payload: {
    brand_id: string;
    review_group_id?: string | null;
    title: string;
    content: string;
    run_ai?: boolean;
  }): Promise<Review> {
    return request<Review>('/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getReview(reviewId: string): Promise<Review> {
    return request<Review>(`/api/v1/reviews/${reviewId}`);
  },

  async getReviewGroupHistory(groupId: string): Promise<ReviewGroupHistory> {
    return request<ReviewGroupHistory>(`/api/v1/review-groups/${groupId}/history`);
  },

  async getBrandReviews(brandId: string): Promise<Review[]> {
    return request<Review[]>(`/api/v1/brands/${brandId}/reviews`);
  },

  // Decisions
  async recordDecision(
    reviewId: string,
    payload: {
      decision: 'approved' | 'needs_changes' | 'rejected';
      reviewer_label?: string;
      note?: string | null;
    }
  ): Promise<Decision> {
    return request<Decision>(`/api/v1/reviews/${reviewId}/decisions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Demo Fixture
  async getDemoFixture(): Promise<DemoFixture> {
    return request<DemoFixture>('/api/v1/demo/fixture');
  },
};

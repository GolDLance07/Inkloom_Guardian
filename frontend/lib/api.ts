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
  AssetInspectionResult,
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

function formatErrorDetail(detail: any): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : '';
        return field ? `${field}: ${d.msg}` : d.msg;
      })
      .filter(Boolean)
      .join('; ');
  }
  return JSON.stringify(detail);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;
      let errorCode = 'REQUEST_FAILED';
      try {
        const errorJson = await response.json();
        if (errorJson.error) {
          errorMsg = errorJson.error.message || errorMsg;
          errorCode = errorJson.error.code || errorCode;
        } else if (errorJson.detail) {
          errorMsg = formatErrorDetail(errorJson.detail);
        }
      } catch {
        // use default
      }
      throw new ApiError(errorMsg, response.status, errorCode);
    }

    return await response.json() as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. The server took too long to respond.', 408, 'TIMEOUT');
    }
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

  async deleteBrand(brandId: string): Promise<{ status: string; id: string; name: string }> {
    return request<{ status: string; id: string; name: string }>(`/api/v1/brands/${brandId}`, {
      method: 'DELETE',
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

  // Multi-Modal Asset Inspection
  async inspectAssetImage(brandId: string, file: File): Promise<AssetInspectionResult> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE}/api/v1/brands/${brandId}/assets/inspect-image`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `Upload failed with status ${response.status}`;
        try {
          const errorJson = await response.json();
          if (errorJson.detail) {
            errorMsg = formatErrorDetail(errorJson.detail);
          }
        } catch {
          // default
        }
        throw new ApiError(errorMsg, response.status);
      }

      return (await response.json()) as AssetInspectionResult;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err instanceof ApiError) throw err;
      if (err.name === 'AbortError') {
        throw new ApiError('Image upload and OCR processing timed out. Please try again.', 408, 'TIMEOUT');
      }
      throw new ApiError(err.message || 'Image upload failed', 0, 'UPLOAD_ERROR');
    }
  },
};

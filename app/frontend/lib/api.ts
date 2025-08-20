/**
 * API client for mini-feeds
 * 统一接口契约: { code: number, data: any, msg: string }
 */

import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(data.msg || "API请求失败");
    }

    return data.data as T;
  } catch (error: any) {
    console.error(`API请求失败: ${endpoint}`, error);
    toast.error(error.message || "API请求失败");
    throw error;
  }
}

type ApiResponse<T> = {
  code: number;
  data: T;
  msg: string;
};

// 指标相关类型
export type ContentTypeCTR = {
  day: string;
  kind: string;
  impressions: number;
  clicks: number;
  ctr: number;
};

export type MetricsOverview = {
  dau: {
    value: number;
    growth: number;
    trend: "up" | "down";
  };
  wau: {
    value: number;
  };
  mau: {
    value: number;
  };
  ad_revenue: {
    value: number;
    growth: number;
    trend: "up" | "down";
  };
  gmv: {
    value: number;
    growth: number;
    trend: "up" | "down";
  };
  overall_ctr: {
    value: number;
  };
};

export type AdRevenue = {
  day: string;
  ad_impressions: number;
  ad_clicks: number;
  ad_ctr: number;
  ad_revenue: number;
};

export type ProductRevenue = {
  day: string;
  product_impressions: number;
  product_clicks: number;
  gmv: number;
  conversions: number;
  conversion_rate: number;
};

export type UserRetention = {
  cohort_day: string;
  cohort_size: number;
  active_users: number;
  retention_rate: number;
};

export type ActiveUsers = {
  date: string;
  active_users: number;
};

// 指标相关API
export async function fetchMetricsOverview(): Promise<MetricsOverview> {
  return fetchAPI<MetricsOverview>("/metrics/overview");
}

export async function fetchContentTypeCTR(startDate?: string, endDate?: string, kind?: string): Promise<ContentTypeCTR[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  if (kind) params.append("kind", kind);
  
  return fetchAPI<ContentTypeCTR[]>(`/metrics/ctr?${params.toString()}`);
}

export async function fetchAdRevenue(startDate?: string, endDate?: string): Promise<AdRevenue[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  return fetchAPI<AdRevenue[]>(`/metrics/ad-revenue?${params.toString()}`);
}

export async function fetchProductRevenue(startDate?: string, endDate?: string): Promise<ProductRevenue[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  return fetchAPI<ProductRevenue[]>(`/metrics/product-revenue?${params.toString()}`);
}

export async function fetchUserRetention(daysSince: number = 1, limit: number = 30): Promise<UserRetention[]> {
  const params = new URLSearchParams();
  params.append("days_since", daysSince.toString());
  params.append("limit", limit.toString());
  
  return fetchAPI<UserRetention[]>(`/metrics/retention?${params.toString()}`);
}

export async function fetchActiveUsers(period: "day" | "week" | "month" = "day", startDate?: string, endDate?: string): Promise<ActiveUsers[]> {
  const params = new URLSearchParams();
  params.append("period", period);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  return fetchAPI<ActiveUsers[]>(`/metrics/active-users?${params.toString()}`);
}

// 导出类型，供其他文件使用
export type FeedItem = {
  type: 'content' | 'ad' | 'product';
  id: number;
  score: number;
  position: number;
  reason?: string;
  tracking: {
    event_token: string;
    trace_id: string;
  };
  content?: {
    title: string;
    description?: string;
    author?: {
      id: number;
      name: string;
    };
    created_at: string;
    media?: Array<{
      type: string;
      url: string;
      thumbnail?: string;
    }>;
    tags?: string[] | {
      topics?: string[];
      category?: string;
    };
  };
  ad?: {
    title: string;
    description?: string;
    advertiser?: {
      id: number;
      name: string;
    };
    image_url?: string;
    landing_url: string;
    campaign_id: number;
  };
  product?: {
    title: string;
    description?: string;
    price: number;
    original_price?: number;
    image_url?: string;
    seller?: {
      id: number;
      name: string;
    };
    tags?: string[] | {
      topics?: string[];
      category?: string;
    };
  };
};

// 后端返回的Item类型
export type Item = {
  id: number;
  title: string;
  content: string;
  tags: {
    topics: string[];
    category: string;
  };
  author_id: number;
  media: {
    type: string;
    urls?: string[];
    url?: string;
    thumbnail?: string;
  };
  kind: 'content' | 'ad' | 'product';
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    tags: {
      age_group: string;
      interests: string[];
    };
    id: number;
    created_at: string;
    updated_at: string;
  };
};

// 导出类型，供其他文件使用
export type FeedResponse = {
  server_time: string;
  cursor: string;
  items: FeedItem[];
};

type RelationType = 'like' | 'favorite' | 'follow' | 'block' | 'wishlist';

type RelationRequest = {
  entity_type: string;
  entity_id: number;
  relation_type: RelationType;
  status: 'active' | 'inactive';
};

type EventType = 'impression' | 'click' | 'stay' | 'gmv' | 'ad_impression' | 'ad_click';

type EventRequest = {
  user_id?: number; // 添加用户ID字段，设为可选
  item_id: number;
  event_type: EventType;
  source?: string;
  staytime_ms?: number;
  gmv_amount?: number;
  extra?: Record<string, any>;
  event_token?: string;
  trace_id?: string;
};

const API_BASE = '/api/v1';

/**
 * 通用API请求函数
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const result = await response.json();
  return result as ApiResponse<T>;
}

/**
 * 获取Feed流数据
 */
export async function getFeed(params: {
  count?: number;
  cursor?: string;
  scene?: string;
  slot?: string;
  device?: string;
  geo?: string;
  ab?: string;
  debug?: boolean;
}): Promise<ApiResponse<FeedResponse>> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  return fetchApi<FeedResponse>(`/posts?${queryParams.toString()}`);
}

/**
 * 获取单个内容项
 */
export async function getItem(id: number): Promise<ApiResponse<FeedItem>> {
  return fetchApi<FeedItem>(`/items/${id}`);
}

/**
 * 获取多个内容项
 */
export async function getItems(ids: number[]): Promise<ApiResponse<FeedItem[]>> {
  const queryParams = new URLSearchParams();
  queryParams.append('ids', ids.join(','));
  
  return fetchApi<FeedItem[]>(`/items?${queryParams.toString()}`);
}

/**
 * 上报事件
 */
export async function reportEvent(event: EventRequest): Promise<ApiResponse<null>> {
  return fetchApi<null>('/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

/**
 * 更新关系（点赞、收藏等）
 */
export async function upsertRelation(relation: RelationRequest): Promise<ApiResponse<null>> {
  return fetchApi<null>('/relations/upsert', {
    method: 'POST',
    body: JSON.stringify(relation),
    headers: {
      'Idempotency-Key': `${relation.entity_type}-${relation.entity_id}-${relation.relation_type}-${Date.now()}`,
    },
  });
}

/**
 * 搜索内容
 */
export async function searchItems(params: {
  q: string;
  page?: number;
  page_size?: number;
}): Promise<ApiResponse<{
  items: FeedItem[];
  total: number;
  page: number;
  page_size: number;
}>> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  return fetchApi<{
    items: FeedItem[];
    total: number;
    page: number;
    page_size: number;
  }>(`/search?${queryParams.toString()}`);
}

// Metrics API 类型定义
export type DailyActiveUsers = {
  day: string;
  dau: number;
};

// ContentTypeCTR 类型已在上方定义

export type UserStaytime = {
  day: string;
  avg_staytime_ms: number;
  max_staytime_ms: number;
  min_staytime_ms: number;
};

export type UserInteractionRate = {
  day: string;
  impressions: number;
  interactions: number;
  interaction_rate: number;
};

export type ContentDistribution = {
  kind: string;
  count: number;
  percentage: number;
};

// Metrics API 调用函数
export async function fetchDailyActiveUsers(startDate?: string, endDate?: string): Promise<DailyActiveUsers[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  // 使用fetchAPI函数保持一致性，确保正确的API基础URL
  return fetchAPI<DailyActiveUsers[]>(`/metrics/dau?${params.toString()}`);
}

// fetchContentTypeCTR 函数已在上方定义

export async function fetchUserStaytime(startDate?: string, endDate?: string): Promise<UserStaytime[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  const response = await fetch(`/api/v1/metrics/staytime?${params.toString()}`);
  const json = await response.json() as ApiResponse<UserStaytime[]>;
  
  if (json.code !== 0) {
    throw new Error(json.msg || '获取用户停留时间数据失败');
  }
  
  return json.data;
}

export async function fetchUserInteractionRate(startDate?: string, endDate?: string): Promise<UserInteractionRate[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  const response = await fetch(`/api/v1/metrics/interaction?${params.toString()}`);
  const json = await response.json() as ApiResponse<UserInteractionRate[]>;
  
  if (json.code !== 0) {
    throw new Error(json.msg || '获取用户互动率数据失败');
  }
  
  return json.data;
}

export async function fetchContentDistribution(): Promise<ContentDistribution[]> {
  const response = await fetch('/api/v1/metrics/distribution');
  const json = await response.json() as ApiResponse<ContentDistribution[]>;
  
  if (json.code !== 0) {
    throw new Error(json.msg || '获取内容分布数据失败');
  }
  
  return json.data;
}

export async function refreshMetricsViews(): Promise<{success: boolean}> {
  const response = await fetch('/api/v1/metrics/refresh', {
    method: 'POST',
  });
  const json = await response.json() as ApiResponse<{success: boolean}>;
  
  if (json.code !== 0) {
    throw new Error(json.msg || '刷新指标物化视图失败');
  }
  
  return json.data;
}
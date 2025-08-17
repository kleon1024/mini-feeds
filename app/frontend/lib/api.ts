/**
 * API client for mini-feeds
 * 统一接口契约: { code: number, data: any, msg: string }
 */

type ApiResponse<T> = {
  code: number;
  data: T;
  msg: string;
};

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
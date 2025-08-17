/**
 * 共享类型定义
 */

// Feed流项目类型
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
      id: string;
      name: string;
    };
    created_at: string;
    media?: {
      type: string;
      url: string;
      thumbnail?: string;
    }[];
    tags?: string[];
  };
  ad?: {
    title: string;
    description?: string;
    advertiser?: {
      id: string;
      name: string;
    };
    image_url?: string;
    landing_url: string;
    campaign_id: string;
  };
  product?: {
    title: string;
    description?: string;
    price: number;
    original_price?: number;
    image_url?: string;
    seller?: {
      id: string;
      name: string;
    };
    tags?: string[];
  };
};

// Feed响应类型
export type FeedResponse = {
  server_time: string;
  cursor: string;
  items: FeedItem[];
};

// 关系类型
export type RelationType = 'like' | 'favorite' | 'follow' | 'block' | 'wishlist';

// 关系请求类型
export type RelationRequest = {
  entity_type: string;
  entity_id: string;
  relation_type: RelationType;
  status: 'active' | 'inactive';
};

// 事件类型
export type EventType = 'impression' | 'click' | 'stay' | 'gmv' | 'ad_impression' | 'ad_click';

// 事件请求类型
export type EventRequest = {
  item_id: string;
  event_type: EventType;
  source?: string;
  staytime_ms?: number;
  gmv_amount?: number;
  extra?: Record<string, any>;
  event_token?: string;
  trace_id?: string;
};
/**
 * 埋点上报工具
 * 支持曝光、点击、停留时长等事件上报
 */

import { reportEvent } from './api';

type EventType = 'impression' | 'click' | 'stay' | 'gmv' | 'ad_impression' | 'ad_click';

interface TrackOptions {
  item_id: number;
  event_type: EventType;
  source?: string;
  staytime_ms?: number;
  gmv_amount?: number;
  extra?: Record<string, any>;
  event_token?: string;
  trace_id?: string;
}

// 是否使用模拟数据（开发环境）
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

/**
 * 使用 Beacon API 上报事件（不阻塞页面卸载）
 */
function sendBeacon(data: TrackOptions): boolean {
  if (USE_MOCK_DATA) {
    // 开发环境中，只打印日志而不发送实际请求
    console.log('Tracking event (mock):', data);
    return true;
  }
  
  if (!navigator.sendBeacon) {
    return false;
  }

  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  return navigator.sendBeacon('/api/v1/events', blob);
}

/**
 * 上报事件（优先使用 Beacon API，降级为 fetch）
 */
export async function trackEvent(options: TrackOptions): Promise<void> {
  try {
    if (USE_MOCK_DATA) {
      // 开发环境中，只打印日志
      console.log('Tracking event (mock):', options);
      return;
    }
    
    // 尝试使用 Beacon API（适合页面卸载场景）
    const beaconSuccess = sendBeacon(options);
    
    // 如果 Beacon 失败，降级为普通 fetch
    if (!beaconSuccess) {
      await reportEvent(options);
    }
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * 曝光事件上报
 */
export function trackImpression(itemId: number, options: Omit<TrackOptions, 'item_id' | 'event_type'> = {}): void {
  const eventType = options.extra?.is_ad ? 'ad_impression' : 'impression';
  
  trackEvent({
    item_id: itemId,
    event_type: eventType,
    source: options.source || 'feed',
    ...options,
  });
}

/**
 * 点击事件上报
 */
export function trackClick(itemId: number, options: Omit<TrackOptions, 'item_id' | 'event_type'> = {}): void {
  const eventType = options.extra?.is_ad ? 'ad_click' : 'click';
  
  trackEvent({
    item_id: itemId,
    event_type: eventType,
    source: options.source || 'feed',
    ...options,
  });
}

/**
 * 停留时长上报
 */
export function trackStay(itemId: number, staytimeMs: number, options: Omit<TrackOptions, 'item_id' | 'event_type' | 'staytime_ms'> = {}): void {
  trackEvent({
    item_id: itemId,
    event_type: 'stay',
    staytime_ms: staytimeMs,
    source: options.source || 'feed',
    ...options,
  });
}

/**
 * 曝光计时器 - 用于计算停留时长
 */
export class ExposureTimer {
  private startTime: number | null = null;
  private itemId: number | null = null;
  private options: Omit<TrackOptions, 'item_id' | 'event_type' | 'staytime_ms'>;

  constructor(options: Omit<TrackOptions, 'item_id' | 'event_type' | 'staytime_ms'> = {}) {
    this.options = options;
  }

  /**
   * 开始计时
   */
  start(itemId: number): void {
    this.stop(); // 先停止之前的计时
    this.itemId = itemId;
    this.startTime = Date.now();
    
    // 曝光事件立即上报
    trackImpression(itemId, this.options);
  }

  /**
   * 停止计时并上报停留时长
   */
  stop(): void {
    if (this.startTime && this.itemId) {
      const staytimeMs = Date.now() - this.startTime;
      
      // 只有停留超过800ms才上报
      if (staytimeMs >= 800) {
        trackStay(this.itemId, staytimeMs, this.options);
      }
      
      this.reset();
    }
  }

  /**
   * 重置计时器
   */
  reset(): void {
    this.startTime = null;
    this.itemId = null;
  }
}
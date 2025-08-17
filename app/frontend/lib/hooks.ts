/**
 * React Hooks for data fetching and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFeed, upsertRelation } from './api';

// 直接从api.ts导入类型，而不是从types.ts导入
import type { FeedItem, FeedResponse } from './api';

// 直接使用后端API，不再使用模拟数据
const USE_MOCK_DATA = false;

/**
 * Hook for fetching feed data
 */
export function useFeed(initialParams: {
  count?: number;
  scene?: string;
  slot?: string;
  device?: string;
  geo?: string;
  ab?: string;
  debug?: boolean;
} = {}) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // 提取initialParams的具体属性，避免依赖整个对象
  const { count = 5, scene, slot, device, geo, ab, debug } = initialParams;
  
  // 加载初始数据
  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 使用真实API
      const response = await getFeed({
        count,
        scene,
        slot,
        device,
        geo,
        ab,
        debug
      });
      
      if (response.code === 0 && response.data) {
        // 确保items存在，如果不存在则使用空数组
        const items = response.data.items || [];
        setItems(items);
        setCursor(response.data.cursor || null);
        setHasMore(items.length > 0);
      } else {
        console.error('Failed to fetch feed:', response);
        // 使用空数组而不是抛出错误，避免UI崩溃
        setItems([]);
        setCursor(null);
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }
  }, [count, scene, slot, device, geo, ab, debug]);

  // 加载更多数据
  const loadMore = useCallback(async () => {
    if (!cursor || loading || !hasMore) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 使用真实API
      const response = await getFeed({
        count,
        cursor,
        scene,
        slot,
        device,
        geo,
        ab,
        debug
      });
      
      if (response.code === 0 && response.data) {
        // 确保items存在，如果不存在则使用空数组
        const items = response.data.items || [];
        setItems(prev => [...prev, ...items]);
        setCursor(response.data.cursor || null);
        setHasMore(items.length > 0);
      } else {
        console.error('Failed to fetch more items:', response);
        // 不抛出错误，只是停止加载更多
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }
  }, [cursor, loading, hasMore, count, scene, slot, device, geo, ab, debug]);

  // 刷新数据
  const refresh = useCallback(() => {
    setCursor(null);
    setHasMore(true);
    return loadInitial();
  }, [loadInitial]);

  // 初始加载
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

/**
 * Hook for managing user interactions (like, favorite)
 */
export function useInteraction() {
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, Error>>({});
  // 注意：虽然 entityId 是 number 类型，但 Record 的键仍然是字符串，因为对象键会自动转为字符串

  // 处理交互操作（点赞、收藏等）
  const handleInteraction = useCallback(async (
    entityId: number,
    entityType: string = 'item',
    relationType: 'like' | 'favorite' | 'follow' | 'block' | 'wishlist',
    active: boolean = true
  ) => {
    const actionKey = `${entityType}-${entityId}-${relationType}`;
    
    // 设置操作为进行中
    setPendingActions(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      // 真实API调用
      const response = await upsertRelation({
        entity_id: entityId,
        entity_type: entityType,
        relation_type: relationType,
        status: active ? 'active' : 'inactive',
      });
      
      // 检查响应状态
      if (response.code !== 0) {
        console.error(`Failed to ${relationType}:`, response.msg);
        return false;
      }
      
      // 清除错误（如果有）
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[actionKey];
        return newErrors;
      });
      
      return true;
    } catch (err) {
      // 记录错误
      setErrors(prev => ({
        ...prev,
        [actionKey]: err instanceof Error ? err : new Error('Unknown error'),
      }));
      
      return false;
    } finally {
      // 操作完成
      setPendingActions(prev => {
        const newPending = { ...prev };
        delete newPending[actionKey];
        return newPending;
      });
    }
  }, []);

  // 点赞
  const like = useCallback(
    (itemId: number, active: boolean = true) => handleInteraction(itemId, 'item', 'like', active),
    [handleInteraction]
  );

  // 收藏
  const favorite = useCallback(
    (itemId: number, active: boolean = true) => handleInteraction(itemId, 'item', 'favorite', active),
    [handleInteraction]
  );

  // 关注
  const follow = useCallback(
    (userId: number, active: boolean = true) => handleInteraction(userId, 'user', 'follow', active),
    [handleInteraction]
  );

  return {
    like,
    favorite,
    follow,
    pendingActions,
    errors,
  };
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation({
  onNext,
  onPrev,
  onLike,
  onFavorite,
}: {
  onNext?: () => void;
  onPrev?: () => void;
  onLike?: () => void;
  onFavorite?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
          onNext?.();
          break;
        case 'ArrowLeft':
          onPrev?.();
          break;
        case ' ': // 空格键
          onLike?.();
          event.preventDefault(); // 防止页面滚动
          break;
        case 's':
        case 'S':
          onFavorite?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onLike, onFavorite]);
}

/**
 * Hook for tracking exposure time
 */
export function useExposureTracking() {
  const startTimeRef = useRef<number | null>(null);
  const currentItemIdRef = useRef<string | null>(null);
  
  // 开始曝光计时
  const startExposure = useCallback((itemId: string) => {
    // 如果已有曝光中的项目，先停止它
    if (currentItemIdRef.current && startTimeRef.current) {
      const staytimeMs = Date.now() - startTimeRef.current;
      // 这里可以调用上报API
      console.log(`Item ${currentItemIdRef.current} exposed for ${staytimeMs}ms`);
    }
    
    // 开始新的曝光计时
    currentItemIdRef.current = itemId;
    startTimeRef.current = Date.now();
    
    // 这里可以调用曝光上报API
    console.log(`Item ${itemId} exposure started`);
  }, []);
  
  // 停止曝光计时
  const stopExposure = useCallback(() => {
    if (currentItemIdRef.current && startTimeRef.current) {
      const staytimeMs = Date.now() - startTimeRef.current;
      
      // 这里可以调用上报API
      console.log(`Item ${currentItemIdRef.current} exposed for ${staytimeMs}ms`);
      
      // 重置状态
      currentItemIdRef.current = null;
      startTimeRef.current = null;
    }
  }, []);
  
  // 组件卸载时停止计时
  useEffect(() => {
    return () => {
      stopExposure();
    };
  }, [stopExposure]);
  
  return {
    startExposure,
    stopExposure,
  };
}

// 不再使用模拟数据
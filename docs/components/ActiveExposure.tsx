'use client';

import { useEffect, useRef } from 'react';
import { ExposureTimer } from '@/lib/track';

interface ActiveExposureProps {
  itemId: number;
  isActive: boolean;
  source?: string;
  trackingData?: {
    event_token?: string;
    trace_id?: string;
  };
}

/**
 * 曝光统计组件
 * 当卡片处于活跃状态时，记录曝光和停留时长
 */
export function ActiveExposure({
  itemId,
  isActive,
  source = 'feed',
  trackingData = {},
}: ActiveExposureProps) {
  // 使用ref保存ExposureTimer实例，避免重复创建
  const timerRef = useRef<ExposureTimer | null>(null);
  // 使用ref记录上一次的itemId，避免不必要的更新
  const prevItemIdRef = useRef<number | null>(null);
  // 使用ref记录上一次的isActive状态，避免不必要的更新
  const prevIsActiveRef = useRef<boolean | null>(null);

  useEffect(() => {
    // 如果itemId或isActive状态没有变化，则不需要执行任何操作
    if (itemId === prevItemIdRef.current && isActive === prevIsActiveRef.current) {
      return;
    }
    
    // 更新ref值
    prevItemIdRef.current = itemId;
    prevIsActiveRef.current = isActive;
    
    // 懒初始化ExposureTimer
    if (!timerRef.current) {
      timerRef.current = new ExposureTimer({
        source,
        ...trackingData,
      });
    }

    // 当卡片变为活跃状态时，开始计时
    if (isActive) {
      timerRef.current.start(itemId);
    } else if (timerRef.current) {
      // 当卡片不再活跃时，停止计时并上报
      timerRef.current.stop();
    }

    // 组件卸载时停止计时
    return () => {
      if (timerRef.current) {
        timerRef.current.stop();
      }
    };
  }, [itemId, isActive, source, trackingData]);

  // 这是一个纯逻辑组件，不渲染任何UI
  return null;
}
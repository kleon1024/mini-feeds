'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FeedCard } from '@/components/FeedCard';
import { PagerControls } from '@/components/PagerControls';
import { ActiveExposure } from '@/components/ActiveExposure';
import { useKeyboardNavigation } from '@/lib/hooks';
import type { FeedItem } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CardPagerProps {
  items: FeedItem[];
  onLike?: (itemId: number, liked: boolean) => Promise<boolean>;
  onFavorite?: (itemId: number, favorited: boolean) => Promise<boolean>;
  onItemClick?: (item: FeedItem) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * 卡片翻页器组件
 * 核心容器：管理卡片索引、翻页和预取
 */
export function CardPager({
  items,
  onLike,
  onFavorite,
  onItemClick,
  onLoadMore,
  hasMore = false,
  loading = false,
  className,
}: CardPagerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 使用useMemo缓存items，避免不必要的重新渲染
  const memoizedItems = useMemo(() => items, [items.map(item => item.id).join(',')]);
  
  // 当前显示的卡片
  const currentItem = memoizedItems[currentIndex];
  
  // 处理上一张
  const handlePrev = useCallback((e?: React.MouseEvent) => {
    // 阻止事件冒泡，避免触发卡片点击
    e?.stopPropagation();
    
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);
  
  // 处理下一张
  const handleNext = useCallback((e?: React.MouseEvent) => {
    // 阻止事件冒泡，避免触发卡片点击
    e?.stopPropagation();
    
    if (currentIndex < memoizedItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (hasMore && !loading && onLoadMore) {
      // 如果已经到最后一张，且有更多数据，则加载更多
      onLoadMore();
    }
  }, [currentIndex, memoizedItems.length, hasMore, loading, onLoadMore]);
  
  // 键盘导航
  useKeyboardNavigation({
    onNext: () => handleNext(),
    onPrev: () => handlePrev(),
    onLike: currentItem ? () => onLike?.(currentItem.id, true) : undefined,
    onFavorite: currentItem ? () => onFavorite?.(currentItem.id, true) : undefined,
  });
  
  // 当加载更多数据时，如果当前在最后一张，自动前进到新加载的第一张
  useEffect(() => {
    if (currentIndex === memoizedItems.length - 2 && memoizedItems.length > 1) {
      // 预加载下一批数据
      if (hasMore && !loading && onLoadMore) {
        onLoadMore();
      }
    }
  }, [currentIndex, memoizedItems.length, hasMore, loading, onLoadMore]);
  
  // 如果没有数据，显示加载状态或空状态
  if (memoizedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        {loading ? (
          <p className="text-muted-foreground">加载中...</p>
        ) : (
          <p className="text-muted-foreground">暂无内容</p>
        )}
      </div>
    );
  }
  
  return (
    <section className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-4">
      {/* 卡片容器 */}
      <section className="w-full relative px-4 md:px-16">
        {/* 卡片区域 */}
        <section className="w-full min-h-[220px] h-auto relative">
          {memoizedItems.map((item, index) => {
            // 只渲染当前卡片和相邻的卡片，减少DOM节点数量
            if (Math.abs(index - currentIndex) > 1) return null;
            
            return (
              <article
                key={item.id}
                className={`absolute top-0 left-0 w-full transition-all duration-500 ${
                  index === currentIndex
                    ? 'opacity-100 translate-x-0 z-10'
                    : index < currentIndex
                    ? 'opacity-0 -translate-x-full z-0'
                    : 'opacity-0 translate-x-full z-0'
                }`}
                style={{
                  willChange: 'transform, opacity',
                  pointerEvents: index === currentIndex ? 'auto' : 'none'
                }}
              >
                <FeedCard
                  item={item}
                  onLike={onLike}
                  onFavorite={onFavorite}
                  onItemClick={onItemClick}
                  isActive={index === currentIndex}
                />
                
                {/* 曝光统计 - 只对当前卡片进行曝光统计 */}
                {index === currentIndex && (
                  <ActiveExposure
                    itemId={item.id}
                    isActive={true}
                    trackingData={{
                      event_token: item.tracking.event_token,
                      trace_id: item.tracking.trace_id,
                    }}
                  />
                )}
              </article>
            );
          })}
        </section>
      </section>
      
      {/* 翻页控制 */}
      <PagerControls
        currentIndex={currentIndex}
        totalItems={memoizedItems.length}
        className="mt-4"
        onPrev={handlePrev}
        onNext={handleNext}
      />
      
    </section>
  );
}
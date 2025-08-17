'use client';

import { useState, useCallback } from 'react';
import { CardPager } from '@/components/CardPager';
import { Button } from '@/components/ui/button';
import { useFeed, useInteraction } from '@/lib/hooks';
import type { FeedItem } from '@/lib/api';

export default function Home() {
  // 使用状态记录是否正在加载更多数据，避免重复加载
  const [loadingMore, setLoadingMore] = useState(false);
  
  // 获取Feed数据
  const { items, loading, hasMore, loadMore, refresh } = useFeed({
    count: 5,
    scene: 'home',
  });

  // 用户交互（点赞、收藏）
  const { like, favorite } = useInteraction();

  // 处理加载更多，添加防抖
  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    try {
      await loadMore();
    } finally {
      // 设置一个短暂的延迟，避免频繁触发加载
      setTimeout(() => {
        setLoadingMore(false);
      }, 500);
    }
  }, [loadMore, loadingMore]);

  // 处理卡片点击
  const handleItemClick = useCallback((item: FeedItem) => {
    // 根据类型处理不同的点击行为
    switch (item.type) {
      case 'content':
        // 跳转到内容详情页
        window.location.href = `/item/${item.id}`;
        break;
      case 'ad':
        // 广告点击跳转到落地页
        if (item.ad?.landing_url) {
          window.open(item.ad.landing_url, '_blank');
        }
        break;
      case 'product':
        // 商品点击跳转到商品详情页
        window.location.href = `/product/${item.id}`;
        break;
      default:
        break;
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <article className="w-full max-w-3xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Mini Feeds</h1>
          <p className="text-muted-foreground">发现好东西</p>
        </header>

        {/* 卡片翻页器 */}
        <CardPager
          items={items}
          onLike={like}
          onFavorite={favorite}
          onItemClick={handleItemClick}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loading={loading || loadingMore}
        />

      </article>
    </main>
  );
}

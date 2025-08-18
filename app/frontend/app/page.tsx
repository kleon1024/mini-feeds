'use client';

import { useState, useCallback } from 'react';
import { CardPager } from '@/components/CardPager';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFeed, useInteraction } from '@/lib/hooks';
import type { FeedItem } from '@/lib/api';
import { Sparkles, Zap, RefreshCw, Filter } from 'lucide-react';

export default function Home() {
  // 使用状态记录是否正在加载更多数据，避免重复加载
  const [loadingMore, setLoadingMore] = useState(false);
  
  // 获取Feed数据
  const { items, loading, hasMore, loadMore, refresh } = useFeed({
    count: 8,
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
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-muted/10">
      <article className="w-full max-w-4xl mx-auto">
        {/* 顶部导航栏 */}
        <header className="mb-8 p-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Mini Feeds</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5"
                onClick={() => refresh()}
              >
                <RefreshCw className="h-4 w-4" />
                刷新
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5"
              >
                <Filter className="h-4 w-4" />
                筛选
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow-500" />
              发现好内容，每天更新
            </p>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20 cursor-pointer">
                热门
              </Badge>
              <Badge variant="outline" className="bg-background hover:bg-muted/50 cursor-pointer">
                最新
              </Badge>
              <Badge variant="outline" className="bg-background hover:bg-muted/50 cursor-pointer">
                推荐
              </Badge>
            </div>
          </div>
        </header>

        {/* 内容区域 */}
        <div className="mb-8 max-w-3xl mx-auto py-6">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">正在加载内容...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">暂无内容</p>
              <Button onClick={() => refresh()}>刷新试试</Button>
            </div>
          ) : (
            /* 卡片翻页器 */
            <CardPager
              items={items}
              onLike={like}
              onFavorite={favorite}
              onItemClick={handleItemClick}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              loading={loading || loadingMore}
            />
          )}
        </div>
        
        {/* 底部信息 */}
        <footer className="text-center text-sm text-muted-foreground">
          <p>© 2024 Mini Feeds - 发现更多精彩内容</p>
        </footer>
      </article>
    </main>
  );
}

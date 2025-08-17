'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { LikeButton } from '@/components/LikeButton';
import { FavButton } from '@/components/FavButton';
import { cn } from '@/lib/utils';
import { trackClick } from '@/lib/track';
import type { FeedItem } from '@/lib/api';

// 移除date-fns导入，简化实现

interface FeedCardProps {
  item: FeedItem;
  onLike?: (itemId: number, liked: boolean) => Promise<boolean>;
  onFavorite?: (itemId: number, favorited: boolean) => Promise<boolean>;
  onItemClick?: (item: FeedItem) => void;
  isActive?: boolean;
  className?: string;
}

/**
 * Feed卡片组件
 * 根据item.type渲染不同类型的卡片（内容/广告/商品）
 */
export function FeedCard({
  item,
  onLike,
  onFavorite,
  onItemClick,
  isActive = false,
  className,
}: FeedCardProps) {
  // 获取卡片标题
  const getTitle = () => {
    switch (item.type) {
      case 'content':
        return item.content?.title || '无标题';
      case 'ad':
        return item.ad?.title || '广告';
      case 'product':
        return item.product?.title || '商品';
      default:
        return '未知类型';
    }
  };

  // 获取卡片图片
  const getImage = () => {
    switch (item.type) {
      case 'content':
        return item.content?.media?.[0]?.thumbnail || item.content?.media?.[0]?.url || null;
      case 'ad':
        return item.ad?.image_url || null;
      case 'product':
        return item.product?.image_url || null;
      default:
        return null;
    }
  };

  // 获取创建时间或发布者
  const getMetaInfo = () => {
    switch (item.type) {
      case 'content':
        if (item.content?.created_at) {
          try {
            // 简化时间显示
            const date = new Date(item.content.created_at);
            return date.toLocaleDateString();
          } catch (e) {
            return item.content.created_at;
          }
        }
        return item.content?.author?.name || '';
      case 'ad':
        return item.ad?.advertiser?.name || '广告';
      case 'product':
        return `¥${item.product?.price.toFixed(2)}` || '';
      default:
        return '';
    }
  };

  // 处理卡片点击
  const handleCardClick = () => {
    // 上报点击事件
    trackClick(item.id, {
      event_token: item.tracking.event_token,
      trace_id: item.tracking.trace_id,
      extra: { is_ad: item.type === 'ad' },
    });
    
    // 调用回调函数
    onItemClick?.(item);
  };

  return (
    <Card 
      className={cn(
        'w-full transition-all duration-300',
        isActive ? 'ring-2 ring-primary/20' : 'ring-0',
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="p-4 pb-2">
        <h3 className="text-lg font-semibold truncate">{getTitle()}</h3>
        <p className="text-sm text-muted-foreground">{getMetaInfo()}</p>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 pb-2 h-auto">
        {getImage() && (
          <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md bg-muted">
            <img
              src={getImage()!}
              alt={getTitle()}
              className="object-cover w-full h-full"
            />
          </AspectRatio>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-2 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {item.type === 'content' && '内容'}
          {item.type === 'ad' && '广告'}
          {item.type === 'product' && '商品'}
          {item.reason && (
            <span className="ml-2 text-xs text-muted-foreground">
              {item.reason}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <LikeButton
            itemId={item.id}
            onLike={onLike}
            size="sm"
          />
          <FavButton
            itemId={item.id}
            onFavorite={onFavorite}
            size="sm"
          />
        </div>
      </CardFooter>
    </Card>
  );
}
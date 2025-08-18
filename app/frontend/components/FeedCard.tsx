'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LikeButton } from '@/components/LikeButton';
import { FavButton } from '@/components/FavButton';
import { cn } from '@/lib/utils';
import { trackClick } from '@/lib/track';
import type { FeedItem } from '@/lib/api';
import { BookOpen, ShoppingBag, Megaphone, Calendar, User, Tag, TrendingUp, Clock } from 'lucide-react';

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

  // 获取卡片图标
  const getCardIcon = () => {
    switch (item.type) {
      case 'content':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'ad':
        return <Megaphone className="h-5 w-5 text-green-500" />;
      case 'product':
        return <ShoppingBag className="h-5 w-5 text-amber-500" />;
      default:
        return <BookOpen className="h-5 w-5 text-blue-500" />;
    }
  };

  // 获取卡片标签
  const getCardTags = (): string[] => {
    const tags: string[] = [];
    
    if (item.type === 'content' && item.content?.tags) {
      // 确保 tags 是数组
      const contentTags: string[] = Array.isArray(item.content.tags) 
        ? item.content.tags as string[]
        : typeof item.content.tags === 'object' && item.content.tags !== null
          ? Object.keys(item.content.tags)
          : [];
      return contentTags.slice(0, 3);
    } else if (item.type === 'product' && item.product?.tags) {
      // 确保 tags 是数组
      const productTags: string[] = Array.isArray(item.product.tags) 
        ? item.product.tags as string[]
        : typeof item.product.tags === 'object' && item.product.tags !== null
          ? Object.keys(item.product.tags)
          : [];
      return productTags.slice(0, 3);
    }
    
    return tags;
  };
  
  // 获取内容摘要
  const getContentSummary = (): string | null => {
    if (item.type === 'content' && item.content) {
      return item.content.description || null;
    } else if (item.type === 'product' && item.product) {
      return item.product.description || null;
    } else if (item.type === 'ad' && item.ad) {
      return item.ad.description || null;
    }
    return null;
  };

  // 获取卡片背景渐变色
  const getCardGradient = () => {
    switch (item.type) {
      case 'content':
        return 'from-blue-500/5 to-card';
      case 'ad':
        return 'from-green-500/5 to-card';
      case 'product':
        return 'from-amber-500/5 to-card';
      default:
        return 'from-blue-500/5 to-card';
    }
  };

  return (
    <Card 
      className={cn(
        'w-full h-[380px] transition-all duration-300 overflow-hidden bg-gradient-to-t',
        getCardGradient(),
        isActive ? 'ring-2 ring-primary/20 shadow-md' : 'ring-0 shadow-sm',
        'hover:shadow-lg',
        className
      )}
      onClick={handleCardClick}
    >
      <div className="relative h-full flex flex-col">
        {/* 左侧彩色条 */}
        <div 
          className={cn(
            'absolute left-0 top-0 w-1 h-full',
            item.type === 'content' ? 'bg-blue-500' : 
            item.type === 'ad' ? 'bg-green-500' : 
            'bg-amber-500'
          )}
        />
        
        {/* 卡片类型标签 */}
        <div className="absolute right-4 top-4">
          {item.type === 'ad' && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <Megaphone className="mr-1 h-3 w-3" />
              广告
            </Badge>
          )}
          {item.type === 'product' && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              <ShoppingBag className="mr-1 h-3 w-3" />
              商品
            </Badge>
          )}
        </div>
        
        <CardHeader className="p-6 pb-3 pl-8">
          <div className="flex items-center gap-2 mb-2">
            {getCardIcon()}
            <CardTitle className="text-lg font-semibold truncate">{getTitle()}</CardTitle>
          </div>
          <CardDescription className="flex items-center gap-1.5">
            {item.type === 'content' && item.content?.author?.name && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {item.content.author.name}
              </span>
            )}
            {item.type === 'content' && item.content?.created_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(item.content.created_at).toLocaleDateString()}
              </span>
            )}
            {item.type === 'product' && item.product?.price && (
              <span className="flex items-center text-amber-600 font-medium">
                ¥{item.product.price.toFixed(2)}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 pt-0 pb-3 pl-8 flex-grow">
          <div className="min-h-[80px] flex flex-col">
            {/* 内容摘要 */}
            {getContentSummary() && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {getContentSummary()}
              </p>
            )}
            
            {/* 如果没有摘要，显示推荐理由 */}
            {item.reason && (
              <div className="mt-auto pt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{item.reason}</span>
              </div>
            )}
          </div>
          
          {/* 标签 */}
          {getCardTags().length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {getCardTags().map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        
        <Separator />
        
        <CardFooter className="p-4 flex justify-between items-center mt-auto">
          <div className="text-xs text-muted-foreground flex items-center">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            {new Date().toLocaleDateString()}
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
      </div>
    </Card>
  );
}
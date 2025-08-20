'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavButtonProps {
  itemId: number;
  initialFavorited?: boolean;
  onFavorite?: (itemId: number, favorited: boolean) => Promise<boolean>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 收藏按钮组件
 * 支持初始状态和点击回调
 */
export function FavButton({
  itemId,
  initialFavorited = false,
  onFavorite,
  size = 'md',
  className,
}: FavButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  // 尺寸映射
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  // 图标尺寸映射
  const iconSizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const handleClick = async () => {
    if (pending) return;
    
    // 乐观更新UI
    const newFavorited = !favorited;
    setFavorited(newFavorited);
    setPending(true);
    
    try {
      // 调用回调函数
      if (onFavorite) {
        const success = await onFavorite(itemId, newFavorited);
        
        // 如果失败，回滚UI状态
        if (!success) {
          setFavorited(favorited);
        }
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        sizeMap[size],
        'rounded-full',
        favorited ? 'text-primary hover:text-primary/90' : 'text-muted-foreground hover:text-foreground',
        pending && 'opacity-70 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? '取消收藏' : '收藏'}
    >
      <Bookmark
        size={iconSizeMap[size]}
        className={cn(
          'transition-all',
          favorited ? 'fill-current' : 'fill-none'
        )}
      />
    </Button>
  );
}
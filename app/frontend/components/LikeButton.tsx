'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  itemId: number;
  initialLiked?: boolean;
  onLike?: (itemId: number, liked: boolean) => Promise<boolean>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 点赞按钮组件
 * 支持初始状态和点击回调
 */
export function LikeButton({
  itemId,
  initialLiked = false,
  onLike,
  size = 'md',
  className,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
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
    const newLiked = !liked;
    setLiked(newLiked);
    setPending(true);
    
    try {
      // 调用回调函数
      if (onLike) {
        const success = await onLike(itemId, newLiked);
        
        // 如果失败，回滚UI状态
        if (!success) {
          setLiked(liked);
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
        liked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground',
        pending && 'opacity-70 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      disabled={pending}
      aria-label={liked ? '取消点赞' : '点赞'}
    >
      <Heart
        size={iconSizeMap[size]}
        className={cn(
          'transition-all',
          liked ? 'fill-current' : 'fill-none'
        )}
      />
    </Button>
  );
}
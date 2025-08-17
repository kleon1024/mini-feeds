'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PagerControlsProps {
  currentIndex: number;
  totalItems: number;
  className?: string;
  onPrev?: (e?: React.MouseEvent) => void;
  onNext?: (e?: React.MouseEvent) => void;
}

/**
 * 翻页控制组件
 * 提供进度指示和可选的翻页按钮
 */
export function PagerControls({
  currentIndex,
  totalItems,
  className,
  onPrev,
  onNext,
}: PagerControlsProps) {
  // 处理按钮点击，阻止事件冒泡
  const handlePrevClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPrev?.(e);
  };

  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNext?.(e);
  };

  // 是否可以前进/后退
  const canPrev = currentIndex > 0 && !!onPrev;
  const canNext = currentIndex < totalItems - 1 && !!onNext;

  return (
    <nav className={cn('flex items-center justify-between w-full relative', className)}>
      {/* 上一张按钮 - 仅在有onPrev回调时显示 */}
      {onPrev ? (
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-12 w-12 rounded-full shadow-md hover:shadow-lg transition-all',
            !canPrev && 'opacity-50 cursor-not-allowed',
            'bg-background/80 backdrop-blur-sm'
          )}
          onClick={handlePrevClick}
          disabled={!canPrev}
          aria-label="上一张"
        >
          <ChevronLeft size={24} />
        </Button>
      ) : (
        // 占位元素，保持布局平衡
        <span className="w-12"></span>
      )}

      {/* 进度指示 */}
      <section className="flex flex-col items-center">
        <p className="text-sm font-medium">
          {currentIndex + 1} / {totalItems}
        </p>
        <section className="flex gap-1 mt-1">
          {Array.from({ length: Math.min(totalItems, 5) }).map((_, i) => {
            // 如果总数超过5个，使用省略号表示
            const showEllipsis = totalItems > 5 && i === 2;
            const dotIndex = showEllipsis
              ? Math.floor(totalItems / 2)
              : totalItems <= 5
                ? i
                : i < 2
                  ? i
                  : i + (totalItems - 5);

            return (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  showEllipsis ? 'w-4' : 'w-2',
                  dotIndex === currentIndex
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
                aria-hidden="true"
              />
            );
          })}
        </section>
      </section>

      {/* 下一张按钮 - 仅在有onNext回调时显示 */}
      {onNext ? (
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-12 w-12 rounded-full shadow-md hover:shadow-lg transition-all',
            !canNext && 'opacity-50 cursor-not-allowed',
            'bg-background/80 backdrop-blur-sm'
          )}
          onClick={handleNextClick}
          disabled={!canNext}
          aria-label="下一张"
        >
          <ChevronRight size={24} />
        </Button>
      ) : (
        // 占位元素，保持布局平衡
        <span className="w-12"></span>
      )}
    </nav>
  );
}
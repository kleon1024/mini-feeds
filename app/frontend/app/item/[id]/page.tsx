'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LikeButton } from '@/components/LikeButton';
import { FavButton } from '@/components/FavButton';
import { getItem } from '@/lib/api';
import type { FeedItem, Item } from '@/lib/api';
import { reportEvent } from '@/lib/api';
import Link from 'next/link';

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const numericId = parseInt(id);

  useEffect(() => {
    async function fetchItem() {
      setLoading(true);
      try {
        // 尝试从API获取数据
        const response = await getItem(numericId);
        if (response.code === 0 && response.data) {
          // 将后端返回的Item转换为前端期望的FeedItem格式
          const itemData = response.data as Item;
          
          // 处理媒体内容
          let mediaContent: Array<{ type: string; url: string; thumbnail?: string }> = [];
          if (itemData.media) {
            if (itemData.media.type === 'gallery' && itemData.media.urls) {
              // 将gallery类型的媒体转换为数组格式
              mediaContent = itemData.media.urls.map(url => ({
                type: 'image',
                url: url,
                thumbnail: undefined
              }));
            } else if (itemData.media.url) {
              // 单个媒体项
              mediaContent = [{
                type: itemData.media.type,
                url: itemData.media.url,
                thumbnail: itemData.media.thumbnail
              }];
            }
          }
          
          const feedItem: FeedItem = {
            type: itemData.kind,
            id: itemData.id,
            score: 1.0,
            position: 0,
            tracking: {
              event_token: `token_${itemData.id}`,
              trace_id: `trace_${itemData.id}`,
            },
            content: itemData.kind === 'content' ? {
              title: itemData.title,
              description: itemData.content,
              author: {
                id: itemData.author_id,
                name: itemData.author?.username || '未知作者',
              },
              created_at: itemData.created_at,
              media: mediaContent,
              tags: itemData.tags,
            } : undefined,
            ad: itemData.kind === 'ad' ? {
              title: itemData.title,
              description: itemData.content,
              advertiser: {
                id: itemData.author_id,
                name: itemData.author?.username || '未知广告主',
              },
              image_url: itemData.media?.url,
              landing_url: itemData.media?.urls?.[0] || '#',
              campaign_id: 0,
            } : undefined,
            product: itemData.kind === 'product' ? {
              title: itemData.title,
              description: itemData.content,
              price: 99.9, // 默认价格
              original_price: 199.9, // 默认原价
              image_url: itemData.media?.url,
              seller: {
                id: itemData.author_id || 0,
                name: itemData.author?.username || '未知卖家',
              },
              tags: itemData.tags,
            } : undefined,
          };
          
          setItem(feedItem);
          // 上报点击事件
          reportEvent({
            item_id: numericId,
            event_type: 'click',
          });
        } else {
          throw new Error(response.msg || '获取内容失败');
        }
      } catch (err) {
        console.error('Failed to fetch item from API:', err);
        setError(err instanceof Error ? err.message : '获取内容失败');
        setItem(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchItem();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <p className="text-lg">加载中...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto py-8 flex flex-col justify-center items-center min-h-[50vh]">
        <p className="text-lg text-red-500 mb-4">{error || '内容不存在'}</p>
        <Link href="/">
          <Button>返回首页</Button>
        </Link>
      </div>
    );
  }

  // 根据不同类型的内容渲染不同的详情页
  const renderContent = () => {
    switch (item.type) {
      case 'content':
        return (
          <Card className="w-full max-w-3xl">
            <CardHeader>
              <CardTitle>{item.content?.title}</CardTitle>
              <CardDescription>
                {item.content?.author?.name} · {new Date(item.content?.created_at || '').toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {item.content?.description && (
                  <p className="text-gray-700 dark:text-gray-300">{item.content.description}</p>
                )}
                {item.content?.media && item.content.media.length > 0 && (
                  <div className="space-y-2">
                    {item.content.media.map((media, index) => (
                      <div key={index} className="rounded-md overflow-hidden">
                        {media.type === 'image' ? (
                          <img 
                            src={media.url} 
                            alt={item.content?.title || '内容图片'} 
                            className="w-full h-auto object-cover"
                          />
                        ) : media.type === 'video' ? (
                          <video 
                            src={media.url} 
                            controls 
                            poster={media.thumbnail} 
                            className="w-full"
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
                {item.content?.tags && (
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(item.content.tags) ? (
                      // 如果tags是字符串数组
                      item.content.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                          {tag}
                        </span>
                      ))
                    ) : (
                      // 如果tags是对象
                      <>
                        {item.content.tags.topics && item.content.tags.topics.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                            {tag}
                          </span>
                        ))}
                        {item.content.tags.category && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded-md text-sm">
                            {item.content.tags.category}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex space-x-2">
                <LikeButton itemId={item.id} />
                <FavButton itemId={item.id} />
              </div>
              <Link href="/">
                <Button variant="outline">返回首页</Button>
              </Link>
            </CardFooter>
          </Card>
        );
      
      case 'product':
        return (
          <Card className="w-full max-w-3xl">
            <CardHeader>
              <CardTitle>{item.product?.title}</CardTitle>
              <CardDescription>
                {item.product?.seller?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {item.product?.image_url && (
                  <img 
                    src={item.product.image_url} 
                    alt={item.product.title} 
                    className="w-full h-auto object-cover rounded-md"
                  />
                )}
                {item.product?.description && (
                  <p className="text-gray-700 dark:text-gray-300">{item.product.description}</p>
                )}
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">¥{item.product?.price.toFixed(2)}</span>
                  {item.product?.original_price && (
                    <span className="text-gray-500 line-through">¥{item.product.original_price.toFixed(2)}</span>
                  )}
                </div>
                {item.product?.tags && item.product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.product.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex space-x-2">
                <Button className="bg-red-600 hover:bg-red-700">立即购买</Button>
                <Button variant="outline">加入购物车</Button>
              </div>
              <Link href="/">
                <Button variant="ghost">返回首页</Button>
              </Link>
            </CardFooter>
          </Card>
        );
      
      case 'ad':
        return (
          <Card className="w-full max-w-3xl">
            <CardHeader>
              <CardTitle>{item.ad?.title}</CardTitle>
              <CardDescription>
                {item.ad?.advertiser?.name} · 广告
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {item.ad?.image_url && (
                  <img 
                    src={item.ad.image_url} 
                    alt={item.ad.title} 
                    className="w-full h-auto object-cover rounded-md"
                  />
                )}
                {item.ad?.description && (
                  <p className="text-gray-700 dark:text-gray-300">{item.ad.description}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <a href={item.ad?.landing_url} target="_blank" rel="noopener noreferrer">
                <Button>了解更多</Button>
              </a>
              <Link href="/">
                <Button variant="outline">返回首页</Button>
              </Link>
            </CardFooter>
          </Card>
        );
      
      default:
        return (
          <div className="text-center py-8">
            <p>未知内容类型</p>
            <Link href="/">
              <Button className="mt-4">返回首页</Button>
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-center">
        {renderContent()}
      </div>
    </div>
  );
}
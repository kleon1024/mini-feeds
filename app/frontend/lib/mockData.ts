/**
 * 模拟数据
 * 用于前端开发阶段，模拟API响应
 */

import type { FeedItem } from './api';

// 缓存已生成的模拟数据，避免重复生成
const mockDataCache: Record<string, FeedItem[]> = {};

// 生成随机ID，但使用索引确保稳定性
function generateId(prefix: string, index: number): number {
  // 使用索引生成稳定的整数ID，确保唯一性
  // 不同类型的内容使用不同的ID范围
  const typeOffset = prefix === 'content' ? 10000 : prefix === 'ad' ? 20000 : 30000;
  return typeOffset + index;
}

// 生成随机追踪数据，但使用索引确保稳定性
function generateTracking(index: number) {
  return {
    event_token: `et_${index}_${Math.random().toString(36).substring(2, 8)}`,
    trace_id: `tr_${index}_${Math.random().toString(36).substring(2, 8)}`,
  };
}

// 生成模拟内容项
export function generateMockContent(index: number): FeedItem {
  return {
    type: 'content',
    id: generateId('content', index),
    score: 0.9 - (index * 0.01), // 使分数更加稳定，随索引递减
    position: index,
    reason: index % 3 === 0 ? '根据你的兴趣推荐' : undefined, // 使推荐理由更加稳定
    tracking: generateTracking(index),
    content: {
      title: `这是一个有趣的内容标题 ${index}`,
      description: '这是内容的详细描述，可以包含多行文本。这是一个模拟的内容项，用于前端开发阶段测试。',
      author: {
        id: 1000 + (index % 20), // 限制作者数量，增加稳定性
        name: `用户${index % 20}`,
      },
      created_at: new Date(Date.now() - (index * 86400000)).toISOString(), // 每个索引递减一天
      media: [
        {
          type: 'image',
          // 使用固定的图片URL，避免每次都请求新图片
          url: `https://picsum.photos/id/${(index % 30) + 1}/800/450`,
          thumbnail: `https://picsum.photos/id/${(index % 30) + 1}/400/225`,
        },
      ],
      tags: ['推荐', '热门', '新鲜'],
    },
  };
}

// 生成模拟广告项
export function generateMockAd(index: number): FeedItem {
  return {
    type: 'ad',
    id: generateId('ad', index),
    score: 0.8 - (index * 0.01), // 使分数更加稳定，随索引递减
    position: index,
    tracking: generateTracking(index),
    ad: {
      title: `品牌推广广告 ${index}`,
      description: '这是一个广告描述，展示品牌或产品的主要特点和优势。',
      advertiser: {
        id: 2000 + (index % 10), // 限制广告主数量，增加稳定性
        name: `广告主${index % 10}`,
      },
      // 使用固定的图片URL，避免每次都请求新图片
      image_url: `https://picsum.photos/id/${(index % 30) + 30}/800/450`,
      landing_url: 'https://example.com/ad-landing',
      campaign_id: 3000 + (index % 5), // 限制广告活动数量，增加稳定性
    },
  };
}

// 生成模拟商品项
export function generateMockProduct(index: number): FeedItem {
  const basePrice = 100 + (index % 10) * 100; // 基础价格更加稳定
  const discountPercent = (index % 5) * 0.1; // 折扣更加稳定
  const price = Math.floor(basePrice * (1 - discountPercent));
  
  return {
    type: 'product',
    id: generateId('product', index),
    score: 0.85 - (index * 0.01), // 使分数更加稳定，随索引递减
    position: index,
    tracking: generateTracking(index),
    product: {
      title: `热销商品 ${index}`,
      description: '这是商品描述，详细介绍商品的特点、材质、用途等信息。',
      price,
      original_price: basePrice,
      // 使用固定的图片URL，避免每次都请求新图片
      image_url: `https://picsum.photos/id/${(index % 30) + 60}/800/450`,
      seller: {
        id: 4000 + (index % 15), // 限制卖家数量，增加稳定性
        name: `商家${index % 15}`,
      },
      tags: ['限时折扣', '热卖', '包邮'],
    },
  };
}

// 生成模拟Feed流数据，使用缓存提高稳定性
export function generateMockFeed(count: number = 10): FeedItem[] {
  const cacheKey = `feed_${count}`;
  
  // 如果缓存中已有数据，直接返回
  if (mockDataCache[cacheKey]) {
    return mockDataCache[cacheKey];
  }
  
  const items: FeedItem[] = [];
  
  for (let i = 0; i < count; i++) {
    // 按一定比例生成不同类型的项
    const typeIndex = i % 10; // 使类型分布更加稳定
    
    if (typeIndex < 7) {
      // 70%的概率是内容
      items.push(generateMockContent(i));
    } else if (typeIndex < 9) {
      // 20%的概率是广告
      items.push(generateMockAd(i));
    } else {
      // 10%的概率是商品
      items.push(generateMockProduct(i));
    }
  }
  
  // 缓存生成的数据
  mockDataCache[cacheKey] = items;
  
  return items;
}

// 模拟API响应
export function mockApiResponse<T>(data: T, code: number = 0, msg: string = ''): {
  code: number;
  data: T;
  msg: string;
} {
  return {
    code,
    data,
    msg,
  };
}
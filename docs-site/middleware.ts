import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const locales = ['en', 'zh'];
const defaultLocale = 'zh';

// 创建国际化中间件
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // 匹配所有路径，但排除静态资源和API路由
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\.svg).*)'],
};
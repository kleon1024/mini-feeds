import {notFound} from 'next/navigation';

export const locales = ['en', 'zh'];
export const defaultLocale = 'zh';

// 这个函数用于获取请求的语言环境
export function getLocale(request) {
  const locale = request?.headers?.get('x-locale') || defaultLocale;
  if (!locales.includes(locale)) return defaultLocale;
  return locale;
}

// 这个函数用于验证语言环境
export function validateLocale(locale) {
  if (!locales.includes(locale)) notFound();
  return locale;
}
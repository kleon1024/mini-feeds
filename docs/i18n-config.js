// i18n-config.js
export const defaultLocale = 'zh';
export const locales = ['en', 'zh'];

export function getLocalePartsFrom(path) {
  const pathWithoutLocale = path.replace(/\/(en|zh)(\/|$)/, '/');
  const currentLocale = path === pathWithoutLocale ? defaultLocale : path.split('/')[1];
  return { pathWithoutLocale, currentLocale };
}
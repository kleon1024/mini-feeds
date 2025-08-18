// i18n.config.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
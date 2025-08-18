// next-intl.config.js
module.exports = {
  locales: ['en', 'zh'],
  defaultLocale: 'zh',
  // 可选：配置日期、数字等格式化选项
  formats: {
    dateTime: {
      short: {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    }
  }
};
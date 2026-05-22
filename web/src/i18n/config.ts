export const locales = ["vi", "zh-CN", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";

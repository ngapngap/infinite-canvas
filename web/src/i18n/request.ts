import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const [common, nav, canvas, canvasProjects, prompts, auth, admin, home, errors] = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/nav.json`),
    import(`../../messages/${locale}/canvas.json`),
    import(`../../messages/${locale}/canvas-projects.json`),
    import(`../../messages/${locale}/prompts.json`),
    import(`../../messages/${locale}/auth.json`),
    import(`../../messages/${locale}/admin.json`),
    import(`../../messages/${locale}/home.json`),
    import(`../../messages/${locale}/errors.json`),
  ]);

  return {
    locale,
    messages: {
      common: common.default,
      nav: nav.default,
      canvas: canvas.default,
      canvasProjects: canvasProjects.default,
      prompts: prompts.default,
      auth: auth.default,
      admin: admin.default,
      home: home.default,
      errors: errors.default,
    },
  };
});

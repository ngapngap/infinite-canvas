import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "./config";

// CUSTOM: deep-merge optional override messages from messages/<locale>-overrides/<ns>.json
// so fork-local string customizations survive `git merge upstream/main` without touching base files.
function deepMerge<T extends Record<string, unknown>>(a: T, b: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const existing = a[k];
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      out[k] = deepMerge(existing as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

async function loadWithOverride(locale: string, name: string): Promise<Record<string, unknown>> {
  const base = (await import(`../../messages/${locale}/${name}.json`)).default as Record<string, unknown>;
  try {
    const override = (await import(`../../messages/${locale}-overrides/${name}.json`))
      .default as Record<string, unknown>;
    return deepMerge(base, override);
  } catch {
    return base;
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const [common, nav, canvas, canvasProjects, prompts, auth, admin, home, errors] = await Promise.all([
    loadWithOverride(locale, "common"),
    loadWithOverride(locale, "nav"),
    loadWithOverride(locale, "canvas"),
    loadWithOverride(locale, "canvas-projects"),
    loadWithOverride(locale, "prompts"),
    loadWithOverride(locale, "auth"),
    loadWithOverride(locale, "admin"),
    loadWithOverride(locale, "home"),
    loadWithOverride(locale, "errors"),
  ]);

  return {
    locale,
    messages: {
      common,
      nav,
      canvas,
      canvasProjects,
      prompts,
      auth,
      admin,
      home,
      errors,
    },
  };
});

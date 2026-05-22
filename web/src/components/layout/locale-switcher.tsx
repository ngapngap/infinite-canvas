"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";

const localeLabels: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (nextLocale: string) => {
    // Remove current locale prefix from pathname if present
    const segments = pathname.split("/").filter(Boolean);
    const localeKeys = Object.keys(localeLabels);
    const hasLocalePrefix = localeKeys.includes(segments[0]);
    const pathWithoutLocale = hasLocalePrefix ? "/" + segments.slice(1).join("/") : pathname;

    // Build new path
    const newPath = nextLocale === "vi" ? pathWithoutLocale : `/${nextLocale}${pathWithoutLocale}`;
    router.push(newPath || "/");
  };

  const items: MenuProps["items"] = Object.entries(localeLabels).map(([key, label]) => ({
    key,
    label,
    disabled: key === locale,
  }));

  return (
    <Dropdown
      menu={{ items, onClick: ({ key }) => switchLocale(key) }}
      trigger={["click"]}
      placement="bottomRight"
    >
      <button
        type="button"
        className="inline-flex size-8 shrink-0 items-center justify-center text-stone-600 transition hover:text-stone-950 dark:text-stone-300 dark:hover:text-white"
        aria-label="Switch language"
        title={localeLabels[locale] || locale}
      >
        <Globe className="size-4" />
      </button>
    </Dropdown>
  );
}

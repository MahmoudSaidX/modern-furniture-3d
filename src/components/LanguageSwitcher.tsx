"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeDirections, locales, localeNames, type Locale } from "@/i18n/config";

type LanguageSwitcherProps = {
  currentLocale: Locale;
  label: string;
};

export function LanguageSwitcher({ currentLocale, label }: LanguageSwitcherProps) {
  const pathname = usePathname();

  // Swap only the leading locale segment, keeping the rest of the path.
  const hrefFor = (locale: Locale) => {
    const segments = pathname.split("/");
    segments[1] = locale;
    return segments.join("/");
  };

  return (
    <nav aria-label={label} className="flex gap-4 p-4">
      {locales
        .filter((locale) => locale !== currentLocale)
        .map((locale) => (
          <Link
            key={locale}
            href={hrefFor(locale)}
            hrefLang={locale}
            lang={locale}
            dir={localeDirections[locale]}
          >
            {localeNames[locale]}
          </Link>
        ))}
    </nav>
  );
}

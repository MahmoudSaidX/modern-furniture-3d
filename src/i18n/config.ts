export const locales = ["en", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeDirections: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

// Each locale's name in its own language, for the language switcher.
export const localeNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

export type LocalizedText = Record<Locale, string>;

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

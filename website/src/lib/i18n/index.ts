// i18n configuration and exports
import { en, type Translations } from "./en";

// Supported locales
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = "en";

// Language packs
const translations: Record<Locale, Translations> = {
  en,
};

// Get translations for a locale
export function getTranslations(locale: Locale = defaultLocale): Translations {
  return translations[locale] || translations[defaultLocale];
}

// Type-safe translation getter with dot notation
type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
    }[Extract<keyof T, string>];

type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
    ? F
    : T extends [infer F, ...infer R]
      ? F extends string
        ? `${F}${D}${Join<Extract<R, string[]>, D>}`
        : never
      : string;

export type TranslationKey = Join<PathsToStringProps<Translations>, ".">;

// Get nested value by path
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

// Translation function
export function t(key: string, locale: Locale = defaultLocale): string {
  const value = getNestedValue(
    translations[locale] || translations[defaultLocale],
    key
  );
  if (typeof value === "string") {
    return value;
  }
  console.warn(`Translation key not found: ${key}`);
  return key;
}

// Export types
export type { Translations };
export { en };

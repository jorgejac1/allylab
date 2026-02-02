"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getTranslations, type Locale, type Translations, defaultLocale } from "./index";

interface I18nContextValue {
  locale: Locale;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  locale?: Locale;
}

export function I18nProvider({ children, locale = defaultLocale }: I18nProviderProps) {
  const translations = getTranslations(locale);

  return (
    <I18nContext.Provider value={{ locale, t: translations }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export function useTranslations() {
  const { t } = useI18n();
  return t;
}

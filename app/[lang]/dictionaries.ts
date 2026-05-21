import "server-only";

const dictionaries = {
  nl: () => import("./dictionaries/nl.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
} as const;

export type Locale = keyof typeof dictionaries;
export const LOCALES = Object.keys(dictionaries) as Locale[];

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries;

export const getDictionary = async (locale: Locale) => dictionaries[locale]();

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

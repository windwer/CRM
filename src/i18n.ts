import { getRequestConfig } from "next-intl/server";

export const locales = ["es"] as const;
export const defaultLocale = "es";

// Para añadir un idioma: crear messages/{locale}.json con las mismas
// claves que es.json y añadir el locale al array de locales.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: (typeof locales)[number] = locales.includes(
    requested as (typeof locales)[number]
  )
    ? (requested as (typeof locales)[number])
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

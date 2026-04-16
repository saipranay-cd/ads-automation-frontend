/**
 * Static option lists for the onboarding wizard and Business Profile settings card.
 */

export const TEAM_SIZES = [
  { id: "solo", label: "Just me" },
  { id: "2_5", label: "2–5" },
  { id: "6_20", label: "6–20" },
  { id: "21_50", label: "21–50" },
  { id: "51_200", label: "51–200" },
  { id: "200_plus", label: "200+" },
] as const

export const BUSINESS_TYPES = [
  { id: "B2B", label: "B2B", desc: "Selling to businesses" },
  { id: "B2C", label: "B2C", desc: "Selling to consumers" },
  { id: "D2C", label: "D2C", desc: "Direct-to-consumer brand" },
  { id: "B2B2C", label: "B2B2C", desc: "Via businesses to consumers" },
] as const

export const PRIMARY_GOALS = [
  { id: "lead_gen", label: "Lead generation" },
  { id: "sales", label: "Sales / Purchases" },
  { id: "signups", label: "Signups / Trials" },
  { id: "app_installs", label: "App installs" },
  { id: "brand_awareness", label: "Brand awareness" },
  { id: "retention", label: "Retention" },
  { id: "traffic", label: "Traffic" },
] as const

export const CURRENCIES = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
  { code: "SGD", label: "Singapore Dollar (S$)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
  { code: "CNY", label: "Chinese Yuan (¥)" },
  { code: "HKD", label: "Hong Kong Dollar (HK$)" },
  { code: "MYR", label: "Malaysian Ringgit (RM)" },
  { code: "PHP", label: "Philippine Peso (₱)" },
  { code: "THB", label: "Thai Baht (฿)" },
  { code: "IDR", label: "Indonesian Rupiah (Rp)" },
  { code: "ZAR", label: "South African Rand (R)" },
  { code: "BRL", label: "Brazilian Real (R$)" },
  { code: "MXN", label: "Mexican Peso (Mex$)" },
  { code: "TRY", label: "Turkish Lira (₺)" },
  { code: "SAR", label: "Saudi Riyal (SAR)" },
] as const

export const LOCALES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "en-IN", label: "English (India)" },
  { code: "en-AU", label: "English (Australia)" },
  { code: "en-CA", label: "English (Canada)" },
  { code: "en-AE", label: "English (UAE)" },
  { code: "en-SG", label: "English (Singapore)" },
  { code: "ar-AE", label: "Arabic (UAE)" },
  { code: "ar-SA", label: "Arabic (Saudi Arabia)" },
  { code: "fr-FR", label: "French (France)" },
  { code: "de-DE", label: "German (Germany)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "es-MX", label: "Spanish (Mexico)" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "ja-JP", label: "Japanese (Japan)" },
] as const

/**
 * Best-guess currency from a BCP-47 locale. Used to pre-fill the currency
 * step in onboarding after we auto-detect the user's locale.
 */
export const LOCALE_TO_CURRENCY: Record<string, string> = {
  "en-IN": "INR",
  "en-US": "USD",
  "en-GB": "GBP",
  "en-AU": "AUD",
  "en-CA": "CAD",
  "en-AE": "AED",
  "ar-AE": "AED",
  "en-SG": "SGD",
  "ar-SA": "SAR",
  "fr-FR": "EUR",
  "de-DE": "EUR",
  "es-ES": "EUR",
  "es-MX": "MXN",
  "pt-BR": "BRL",
  "ja-JP": "JPY",
}

// ─── Google Ads API Types ────────────────────────────────

export interface GoogleAdAccount {
  id: string
  name: string
  currency: string
  timezone: string
  syncedAt: string | null
}

export interface GoogleCampaign {
  id: string
  name: string
  status: "ENABLED" | "PAUSED" | "REMOVED"
  campaignType: string
  dailyBudgetMicros: number | null
  biddingStrategy: string | null
}

export interface GoogleAdGroup {
  id: string
  name: string
  status: string
  cpcBidMicros: number | null
  campaignId: string
  campaignName?: string
}

export interface GoogleAd {
  id: string
  adType: string
  headlines: string[]
  descriptions: string[]
  status: string
  finalUrl: string | null
  adGroupId: string
  adGroupName?: string
}

export interface GoogleKeyword {
  id: string
  text: string
  matchType: "EXACT" | "PHRASE" | "BROAD"
  status: string
  qualityScore: number | null
  cpcBidMicros: number | null
  adGroupId: string
  adGroupName?: string
}

export interface GoogleCampaignInsight {
  campaignId: string
  date: string
  impressions: number
  clicks: number
  spend: number
  conversions: number | null
  ctr: number
  cpc: number
  cpm: number
  conversionRate: number | null
  costPerConversion: number | null
}

// ─── Table Row Types ────────────────────────────────────

export interface GoogleCampaignRow {
  id: string
  name: string
  status: "ENABLED" | "PAUSED" | "REMOVED"
  campaignType: string
  dailyBudget: number // converted from micros to dollars
  impressions: number
  clicks: number
  spend: number
  conversions: number
  ctr: number
  cpc: number
  costPerConversion: number | null
  isActive: boolean
}

export interface GoogleAdGroupRow {
  id: string
  name: string
  status: string
  campaignName: string
  campaignId: string
  cpcBid: number // converted from micros
  impressions: number
  clicks: number
  spend: number
  conversions: number
  ctr: number
  cpc: number
  isActive: boolean
}

export interface GoogleAdRow {
  id: string
  adType: string
  headlines: string[]
  descriptions: string[]
  finalUrl: string | null
  status: string
  adGroupName: string
  adGroupId: string
  impressions: number
  clicks: number
  spend: number
  ctr: number
  cpc: number
  isActive: boolean
}

// ── Asset payload (full drawer) ────────────────────────

export type GoogleAssetScope = "ad" | "adGroup" | "campaign" | "customer"

export interface GoogleSitelinkAsset {
  id: string
  scope: GoogleAssetScope
  linkText: string
  description1?: string
  description2?: string
  finalUrls: string[]
}
export interface GoogleCalloutAsset {
  id: string
  scope: GoogleAssetScope
  text: string
}
export interface GoogleStructuredSnippetAsset {
  id: string
  scope: GoogleAssetScope
  header: string
  values: string[]
}
export interface GoogleCallAsset {
  id: string
  scope: GoogleAssetScope
  phoneNumber: string
  countryCode?: string
}
export interface GoogleLeadFormAsset {
  id: string
  scope: GoogleAssetScope
  businessName: string
  headline?: string
  description?: string
}
export interface GoogleLocationAsset {
  id: string
  scope: GoogleAssetScope
  placeId?: string
  name?: string
}
export interface GooglePriceAsset {
  id: string
  scope: GoogleAssetScope
  priceType: string
  qualifier?: string
  offerings: number
}
export interface GoogleAppAsset {
  id: string
  scope: GoogleAssetScope
  appId: string
  appStore?: string
  linkText?: string
}
export interface GooglePromotionAsset {
  id: string
  scope: GoogleAssetScope
  promotionTarget?: string
  discountModifier?: string
  redemptionStart?: string
  redemptionEnd?: string
}
export interface GoogleImageAsset {
  id: string
  scope: GoogleAssetScope
  url: string | null
  name: string
  width?: number
  height?: number
}
export interface GoogleBusinessNameAsset {
  id: string
  scope: GoogleAssetScope
  text: string
}

export interface GoogleAdAssets {
  sitelinks: GoogleSitelinkAsset[]
  callouts: GoogleCalloutAsset[]
  structuredSnippets: GoogleStructuredSnippetAsset[]
  calls: GoogleCallAsset[]
  leadForms: GoogleLeadFormAsset[]
  locations: GoogleLocationAsset[]
  prices: GooglePriceAsset[]
  apps: GoogleAppAsset[]
  promotions: GooglePromotionAsset[]
  images: GoogleImageAsset[]
  businessName: GoogleBusinessNameAsset | null
  businessLogos: GoogleImageAsset[]
}

export interface GoogleAdDetail {
  id: string
  adType: string
  status: string
  headlines: string[]
  descriptions: string[]
  finalUrl: string | null
  adGroupId: string
  adGroupName: string
  campaignId: string
  campaignName: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  metrics: {
    impressions: number
    clicks: number
    spend: number
    ctr: number
    cpc: number
  }
  assets: GoogleAdAssets
}

export interface GoogleKeywordRow {
  id: string
  text: string
  matchType: string
  status: string
  qualityScore: number | null
  cpcBid: number // converted from micros
  adGroupId: string
  adGroupName: string
  campaignId: string
  campaignName: string
  impressions: number
  clicks: number
  spend: number
  ctr: number
  cpc: number
  conversions: number
  isActive: boolean
}

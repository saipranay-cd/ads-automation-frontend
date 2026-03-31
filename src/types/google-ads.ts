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

export interface GoogleKeywordRow {
  id: string
  text: string
  matchType: string
  status: string
  qualityScore: number | null
  cpcBid: number // converted from micros
  adGroupName: string
  impressions: number
  clicks: number
  spend: number
  ctr: number
  cpc: number
  conversions: number
  isActive: boolean
}

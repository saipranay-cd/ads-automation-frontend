// ─── Business Profile ────────────────────────────────────

export type IndustryId =
  | "real_estate"
  | "ecommerce"
  | "saas"
  | "local_services"
  | "agency"
  | "healthcare"
  | "education"
  | "finance"
  | "hospitality"
  | "automotive"
  | "professional_services"
  | "b2b_enterprise"
  | "other";

export type TeamSize = "solo" | "2_5" | "6_20" | "21_50" | "51_200" | "200_plus";
export type BusinessType = "B2B" | "B2C" | "D2C" | "B2B2C";
export type PrimaryGoal =
  | "lead_gen"
  | "sales"
  | "brand_awareness"
  | "app_installs"
  | "retention"
  | "traffic"
  | "signups";

// ─── Meta Graph API Response Types ───────────────────────

export interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number;
  business?: { id: string; name: string };
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";
  objective: string;
  daily_budget?: string; // in cents
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
  targeting?: Record<string, unknown>;
  campaign_id: string;
}

export interface MetaAd {
  id: string;
  name: string;
  status: string;
  creative?: { id: string };
  adset_id: string;
}

export interface MetaInsight {
  date_start: string;
  date_stop: string;
  impressions: string;
  clicks: string;
  spend: string;
  reach: string;
  ctr: string;
  cpc: string;
  cpm: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  cost_per_action_type?: Array<{
    action_type: string;
    value: string;
  }>;
}

export interface MetaPaginatedResponse<T> {
  data: T[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
    previous?: string;
  };
}

// ─── App-Level Types ─────────────────────────────────────

export type CampaignStatus = "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";

export type InsightType =
  | "performance_summary"
  | "suggestion"
  | "copy_variant"
  | "budget_optimization";

export type EntityType = "campaign" | "adset" | "ad" | "account";

export type AdFormat = "SINGLE_IMAGE" | "CAROUSEL" | "VIDEO" | "COLLECTION";

export type BudgetType = "DAILY" | "LIFETIME";

export type LeadDestination =
  | "INSTANT_FORM"
  | "WEBSITE"
  | "MESSENGER"
  | "CALLS";

export type DraftStatus = "DRAFT" | "PUBLISHING" | "LIVE" | "FAILED";

export type AdCategory =
  | "NONE"
  | "CREDIT"
  | "EMPLOYMENT"
  | "HOUSING"
  | "ISSUES_ELECTIONS_POLITICS";

// ─── Wizard Draft ───────────────────────────────────────

export type Objective = "Lead Generation" | "Traffic" | "Brand Awareness" | "Conversions" | "Reach"
export type SpecialAdCategory = "Housing" | "Credit" | "Employment" | "None"
export type BidStrategy = "Lowest Cost" | "Cost Cap" | "Bid Cap" | "Target Cost"
export type GenderTarget = "all" | "male" | "female"
export type AudienceType = "Interest" | "Custom" | "Lookalike"
export type CallToAction = "Learn More" | "Sign Up" | "Get Offer" | "Book Now" | "Contact Us" | "Apply Now" | "Download" | "WhatsApp"

export type LeadFormMode = "existing" | "new" | "skip"
export type LeadFormType = "MORE_VOLUME" | "HIGHER_INTENT"

export interface LeadFormQuestion {
  type: string
  key: string
  label?: string
}

export interface LeadFormCustomQuestion {
  key: string
  label: string
  options?: string[]
}

export interface WizardDraft {
  id?: string
  status: DraftStatus
  currentStep: number
  // Step 1 — Details
  campaignName: string
  objective: Objective
  specialAdCategory: SpecialAdCategory
  budgetType: BudgetType
  dailyBudget: number
  bidStrategy: BidStrategy
  // Step 2 — Targeting
  locations: string[]
  ageMin: number
  ageMax: number
  gender: GenderTarget
  interests: string[]
  audienceType: AudienceType
  // Step 3 — Creative
  primaryText: string
  headline: string
  description: string
  callToAction: CallToAction
  landingPageUrl: string
  creativeJson: Record<string, unknown>
  // Step 3 — UTM
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent: string
  utmTerm: string
  // Step 4 — Lead Form
  leadFormMode: LeadFormMode
  leadFormId: string
  leadFormName: string
  leadFormType: LeadFormType
  leadFormQuestions: LeadFormQuestion[]
  leadFormCustomQuestions: LeadFormCustomQuestion[]
  privacyPolicyUrl: string
  thankYouTitle: string
  thankYouBody: string
  crmWebhookUrl: string
  crmTag: string
}

// ─── Product Knowledge Base ──────────────────────────────

export interface KBLink {
  url: string
  description: string
}

export type KPIType = "cpl" | "roas" | "ctr" | "cpc" | "cpql" | "leads" | "conversions" | "spend" | "custom"

export interface KBObjectiveSnapshot {
  date: string
  actual: number
  notes?: string
}

export interface KBObjective {
  id: string
  knowledgeBaseId: string
  kpiType: KPIType | string
  label: string
  freeTextGoal?: string | null
  targetValue?: number | null
  targetUnit?: string | null
  direction: string
  snapshots: KBObjectiveSnapshot[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ProductKnowledgeBase {
  id: string
  adAccountId: string
  platform: string
  campaignId: string // "" = account-level, else campaign-specific
  campaignName?: string | null
  productDescription?: string | null
  idealCustomer?: string | null
  pricingContext?: string | null
  competitorContext?: string | null
  customNotes?: string | null
  links: KBLink[]
  objectives: KBObjective[]
  createdAt: string
  updatedAt: string
}

// ─── Dashboard View Types ────────────────────────────────

export interface MetricCardData {
  label: string;
  value: string;
  delta?: number; // percentage change
  deltaDirection?: "up" | "down";
  deltaIsGood?: boolean; // up + good = green, up + bad = red
  subtext?: string;
}

export interface CampaignTableRow {
  id: string;
  name: string;
  status: CampaignStatus;
  objective: string;
  dailyBudget: number;
  costPerLead: number | null;
  pacing: number; // 0-100
  leads: number;
  results: number;
  costPerResult: number | null;
  amountSpent: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  cpm: number;
  isActive: boolean;
}

export interface AdSetTableRow {
  id: string;
  name: string;
  status: string;
  campaignName: string;
  campaignId: string;
  dailyBudget: number;
  amountSpent: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
  costPerLead: number | null;
  results: number;
  costPerResult: number | null;
  isActive: boolean;
}

export interface AdTableRow {
  id: string;
  name: string;
  status: string;
  adSetName: string;
  adSetId: string;
  thumbnailUrl: string | null;
  amountSpent: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
  costPerLead: number | null;
  results: number;
  costPerResult: number | null;
  isActive: boolean;
}

export interface AdDetail {
  id: string
  name: string
  status: string
  createdAt: string
  updatedAt: string
  adSetId: string
  adSetName: string
  campaignId: string
  campaignName: string
  objective: string | null
  creative: {
    body: string | null
    title: string | null
    description: string | null
    cta: string | null
    link: string | null
    thumbnailUrl: string | null
    videoId: string | null
  }
  metrics: {
    amountSpent: number
    impressions: number
    reach: number
    clicks: number
    leads: number
    ctr: number
    cpc: number
    cpm: number
    costPerLead: number | null
  }
}

export interface AiInsightData {
  id: string;
  type: "ai" | "budget" | "opportunity" | "warning";
  tag: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaAction?: string;
  dismissible?: boolean;
}

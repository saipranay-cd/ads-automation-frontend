import type {
  MetaAdAccount,
  MetaCampaign,
  MetaInsight,
  MetaAdSet,
  MetaAd,
  MetaPaginatedResponse,
} from "@/types/adsflow"

const META_BASE = `https://graph.facebook.com/${process.env.META_API_VERSION || "v20.0"}`

export class MetaAPIError extends Error {
  constructor(
    public status: number,
    public metaError?: { message: string; type: string; code: number }
  ) {
    super(metaError?.message || `Meta API error: ${status}`)
    this.name = "MetaAPIError"
  }
}

export class MetaAPI {
  constructor(private accessToken: string) {}

  private async request<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "DELETE"
      params?: Record<string, string>
      body?: Record<string, unknown>
    } = {}
  ): Promise<T> {
    const { method = "GET", params = {}, body } = options
    const url = new URL(`${META_BASE}${endpoint}`)
    url.searchParams.set("access_token", this.accessToken)

    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }

    const init: RequestInit = { method }
    if (body) {
      init.headers = { "Content-Type": "application/json" }
      init.body = JSON.stringify(body)
    }

    const res = await fetch(url.toString(), init)
    const data = await res.json()

    if (!res.ok) {
      throw new MetaAPIError(res.status, data.error)
    }

    return data as T
  }

  async getAdAccounts(): Promise<MetaPaginatedResponse<MetaAdAccount>> {
    return this.request("/me/adaccounts", {
      params: {
        fields: "id,name,currency,timezone_name,account_status",
        limit: "50",
      },
    })
  }

  async getCampaigns(
    adAccountId: string
  ): Promise<MetaPaginatedResponse<MetaCampaign>> {
    return this.request(`/${adAccountId}/campaigns`, {
      params: {
        fields:
          "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
        limit: "100",
      },
    })
  }

  async getAdSets(
    adAccountId: string
  ): Promise<MetaPaginatedResponse<MetaAdSet>> {
    return this.request(`/${adAccountId}/adsets`, {
      params: {
        fields: "id,name,status,daily_budget,targeting,campaign_id",
        limit: "100",
      },
    })
  }

  async getAds(adAccountId: string): Promise<MetaPaginatedResponse<MetaAd>> {
    return this.request(`/${adAccountId}/ads`, {
      params: {
        fields: "id,name,status,creative,adset_id",
        limit: "100",
      },
    })
  }

  async getCampaignInsights(
    campaignId: string,
    datePreset = "last_30d"
  ): Promise<MetaPaginatedResponse<MetaInsight>> {
    return this.request(`/${campaignId}/insights`, {
      params: {
        fields: "impressions,clicks,spend,reach,ctr,cpc,cpm,actions,cost_per_action_type",
        date_preset: datePreset,
        time_increment: "1",
      },
    })
  }

  async updateCampaign(
    campaignId: string,
    updates: Partial<MetaCampaign>
  ): Promise<{ success: boolean }> {
    return this.request(`/${campaignId}`, {
      method: "POST",
      body: updates,
    })
  }

  async pauseCampaign(campaignId: string): Promise<{ success: boolean }> {
    return this.updateCampaign(campaignId, { status: "PAUSED" })
  }

  async activateCampaign(campaignId: string): Promise<{ success: boolean }> {
    return this.updateCampaign(campaignId, { status: "ACTIVE" })
  }

  async updateBudget(
    campaignId: string,
    dailyBudget: number
  ): Promise<{ success: boolean }> {
    // Meta API uses cents
    return this.request(`/${campaignId}`, {
      method: "POST",
      body: { daily_budget: Math.round(dailyBudget * 100) },
    })
  }
}

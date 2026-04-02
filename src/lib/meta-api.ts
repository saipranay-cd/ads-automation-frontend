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

  /**
   * Fetch all pages of a paginated Meta API endpoint.
   * Follows paging.next cursor until no more pages remain.
   */
  private async fetchAll<T>(
    endpoint: string,
    params: Record<string, string>
  ): Promise<T[]> {
    const firstPage = await this.request<MetaPaginatedResponse<T>>(endpoint, { params })
    const allData: T[] = [...firstPage.data]

    let nextUrl = firstPage.paging?.next
    while (nextUrl) {
      const res = await fetch(nextUrl)
      const page = await res.json() as MetaPaginatedResponse<T>
      if (!res.ok) {
        throw new MetaAPIError(res.status, (page as unknown as { error: { message: string; type: string; code: number } }).error)
      }
      allData.push(...page.data)
      nextUrl = page.paging?.next
    }

    return allData
  }

  async getAdAccounts(): Promise<MetaPaginatedResponse<MetaAdAccount>> {
    const data = await this.fetchAll<MetaAdAccount>("/me/adaccounts", {
      fields: "id,name,currency,timezone_name,account_status",
      limit: "50",
    })
    return { data }
  }

  async getCampaigns(
    adAccountId: string
  ): Promise<MetaPaginatedResponse<MetaCampaign>> {
    const data = await this.fetchAll<MetaCampaign>(`/${adAccountId}/campaigns`, {
      fields:
        "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
      limit: "100",
    })
    return { data }
  }

  async getAdSets(
    adAccountId: string
  ): Promise<MetaPaginatedResponse<MetaAdSet>> {
    const data = await this.fetchAll<MetaAdSet>(`/${adAccountId}/adsets`, {
      fields: "id,name,status,daily_budget,targeting,campaign_id",
      limit: "100",
    })
    return { data }
  }

  async getAds(adAccountId: string): Promise<MetaPaginatedResponse<MetaAd>> {
    const data = await this.fetchAll<MetaAd>(`/${adAccountId}/ads`, {
      fields: "id,name,status,creative,adset_id",
      limit: "100",
    })
    return { data }
  }

  async getCampaignInsights(
    campaignId: string,
    datePreset = "last_30d"
  ): Promise<MetaPaginatedResponse<MetaInsight>> {
    const data = await this.fetchAll<MetaInsight>(`/${campaignId}/insights`, {
      fields: "impressions,clicks,spend,reach,ctr,cpc,cpm,actions,cost_per_action_type",
      date_preset: datePreset,
      time_increment: "1",
    })
    return { data }
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

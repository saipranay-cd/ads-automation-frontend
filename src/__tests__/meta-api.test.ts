import { describe, it, expect, vi, beforeEach } from "vitest"
import { MetaAPI, MetaAPIError } from "@/lib/meta-api"

const mockFetch = vi.fn()
global.fetch = mockFetch

function mockResponse(data: unknown, ok = true, status = 200) {
  return { ok, status, json: () => Promise.resolve(data) }
}

describe("MetaAPI", () => {
  let api: MetaAPI

  beforeEach(() => {
    vi.clearAllMocks()
    api = new MetaAPI("test-token-123")
  })

  describe("request basics", () => {
    it("includes access_token in URL params", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }))
      await api.getAdAccounts()
      const calledUrl = mockFetch.mock.calls[0][0]
      expect(calledUrl).toContain("access_token=test-token-123")
    })

    it("throws MetaAPIError on non-ok response", async () => {
      mockFetch.mockResolvedValue(
        mockResponse(
          { error: { message: "Invalid token", type: "OAuthException", code: 190 } },
          false,
          401
        )
      )
      await expect(api.getAdAccounts()).rejects.toThrow(MetaAPIError)
    })

    it("throws MetaAPIError with status code", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ error: { message: "Rate limited", type: "OAuthException", code: 4 } }, false, 429)
      )
      try {
        await api.getAdAccounts()
      } catch (e) {
        expect(e).toBeInstanceOf(MetaAPIError)
        expect((e as MetaAPIError).status).toBe(429)
      }
    })
  })

  describe("pagination (fetchAll)", () => {
    it("fetches single page when no paging.next", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          data: [{ id: "1", name: "Account 1" }],
          paging: { cursors: { before: "a", after: "b" } },
        })
      )
      const result = await api.getAdAccounts()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe("Account 1")
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it("follows paging.next to fetch all pages", async () => {
      // First page
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          data: [{ id: "1", name: "Campaign 1" }],
          paging: {
            cursors: { before: "a", after: "b" },
            next: "https://graph.facebook.com/v20.0/act_123/campaigns?after=b",
          },
        })
      )
      // Second page (via paging.next URL)
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          data: [{ id: "2", name: "Campaign 2" }],
          paging: { cursors: { before: "b", after: "c" } },
        })
      )

      const result = await api.getCampaigns("act_123")
      expect(result.data).toHaveLength(2)
      expect(result.data[0].name).toBe("Campaign 1")
      expect(result.data[1].name).toBe("Campaign 2")
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it("handles 3+ pages of results", async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockResponse({
            data: [{ id: "1" }],
            paging: { cursors: { before: "a", after: "b" }, next: "https://next1" },
          })
        )
        .mockResolvedValueOnce(
          mockResponse({
            data: [{ id: "2" }],
            paging: { cursors: { before: "b", after: "c" }, next: "https://next2" },
          })
        )
        .mockResolvedValueOnce(
          mockResponse({
            data: [{ id: "3" }],
            paging: { cursors: { before: "c", after: "d" } },
          })
        )

      const result = await api.getAdSets("act_123")
      expect(result.data).toHaveLength(3)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it("handles empty first page", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }))
      const result = await api.getCampaigns("act_123")
      expect(result.data).toHaveLength(0)
    })
  })

  describe("updateBudget", () => {
    it("converts dollars to cents (integer)", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }))
      await api.updateBudget("campaign_123", 50.0)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.daily_budget).toBe(5000)
    })

    it("rounds cents to avoid floating point issues", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }))
      await api.updateBudget("campaign_123", 99.99)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.daily_budget).toBe(9999)
      expect(Number.isInteger(body.daily_budget)).toBe(true)
    })

    it("handles zero budget", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }))
      await api.updateBudget("campaign_123", 0)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.daily_budget).toBe(0)
    })
  })

  describe("campaign actions", () => {
    it("pauseCampaign sends PAUSED status", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }))
      await api.pauseCampaign("campaign_123")
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.status).toBe("PAUSED")
    })

    it("activateCampaign sends ACTIVE status", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }))
      await api.activateCampaign("campaign_123")
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.status).toBe("ACTIVE")
    })
  })
})

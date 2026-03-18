"use client"

import { useState, useMemo } from "react"
import { Search, RefreshCw } from "lucide-react"
import { CampaignTable } from "@/components/dashboard/CampaignTable"
import { useCampaigns, useSync } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import type { CampaignTableRow } from "@/types/adsflow"

const statusTabs = ["All", "Active", "Paused", "Archived"] as const
type StatusTab = (typeof statusTabs)[number]

const mockCampaigns: CampaignTableRow[] = [
  {
    id: "1", name: "Summer Sale Leads — Mumbai", status: "ACTIVE", objective: "Lead Generation",
    dailyBudget: 4000, costPerLead: 288.5, pacing: 72, leads: 89,
    results: 89, costPerResult: 288.5, amountSpent: 25676, impressions: 42300, reach: 31200, linkClicks: 1240, cpm: 607.0, isActive: true,
  },
  {
    id: "2", name: "Property Enquiry — Delhi NCR", status: "ACTIVE", objective: "Lead Generation",
    dailyBudget: 6000, costPerLead: 478.3, pacing: 91, leads: 42,
    results: 42, costPerResult: 478.3, amountSpent: 20088, impressions: 28500, reach: 21800, linkClicks: 820, cpm: 704.8, isActive: true,
  },
  {
    id: "3", name: "Home Loan Awareness Q2", status: "PAUSED", objective: "Lead Generation",
    dailyBudget: 2500, costPerLead: 612.0, pacing: 0, leads: 15,
    results: 15, costPerResult: 612.0, amountSpent: 9180, impressions: 15200, reach: 12100, linkClicks: 390, cpm: 604.0, isActive: false,
  },
  {
    id: "4", name: "Tech Workshop Signups", status: "ACTIVE", objective: "Lead Generation",
    dailyBudget: 2000, costPerLead: 215.4, pacing: 65, leads: 67,
    results: 67, costPerResult: 215.4, amountSpent: 14432, impressions: 35100, reach: 28400, linkClicks: 1580, cpm: 411.2, isActive: true,
  },
  {
    id: "5", name: "Insurance Leads — Pune", status: "ACTIVE", objective: "Lead Generation",
    dailyBudget: 3200, costPerLead: 340.2, pacing: 88, leads: 53,
    results: 53, costPerResult: 340.2, amountSpent: 18030, impressions: 31800, reach: 25600, linkClicks: 960, cpm: 566.9, isActive: true,
  },
  {
    id: "6", name: "Fitness Coaching — Bangalore", status: "ACTIVE", objective: "Lead Generation",
    dailyBudget: 2800, costPerLead: 310.5, pacing: 55, leads: 34,
    results: 34, costPerResult: 310.5, amountSpent: 10557, impressions: 22400, reach: 18200, linkClicks: 680, cpm: 471.3, isActive: true,
  },
  {
    id: "7", name: "Real Estate — Hyderabad", status: "PAUSED", objective: "Lead Generation",
    dailyBudget: 5000, costPerLead: 545.0, pacing: 0, leads: 22,
    results: 22, costPerResult: 545.0, amountSpent: 11990, impressions: 19800, reach: 16500, linkClicks: 510, cpm: 605.6, isActive: false,
  },
]

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("All")
  const [search, setSearch] = useState("")
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: campaignsData, isLoading } = useCampaigns(selectedAdAccountId)
  const sync = useSync()

  // Use real data if available, otherwise mock
  const campaigns = campaignsData?.data?.length
    ? campaignsData.data
    : mockCampaigns

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchTab =
        activeTab === "All" ||
        c.status.toLowerCase() === activeTab.toLowerCase()
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
      return matchTab && matchSearch
    })
  }, [campaigns, activeTab, search])

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background:
                  activeTab === tab
                    ? "var(--acc-subtle)"
                    : "transparent",
                color:
                  activeTab === tab
                    ? "var(--acc-text)"
                    : "var(--text-secondary)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => sync.mutate(selectedAdAccountId || undefined)}
            disabled={sync.isPending}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
            style={{
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            <RefreshCw size={12} className={sync.isPending ? "animate-spin" : ""} />
            {sync.isPending ? "Syncing..." : "Sync"}
          </button>
          <div
            className="flex w-[220px] items-center gap-2 rounded-md px-3 py-1.5"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-default)",
            }}
          >
            <Search size={13} style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-text-tertiary"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <CampaignTable campaigns={filtered} isLoading={isLoading} />

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg py-12"
          style={{
            background: "var(--bg-base)",
            border: "1px solid var(--border-default)",
          }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            No campaigns found
          </span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {search ? "Try adjusting your search" : "Sync your Meta ad account to get started"}
          </span>
        </div>
      )}
    </div>
  )
}

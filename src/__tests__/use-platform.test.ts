import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from "next/navigation"
import { usePlatform, getDefaultPlatform, setDefaultPlatform } from "@/hooks/use-platform"

const mockUsePathname = vi.mocked(usePathname)

describe("usePlatform", () => {
  it("returns 'google' for /google/* paths", () => {
    mockUsePathname.mockReturnValue("/google/campaigns")
    expect(usePlatform().platform).toBe("google")
  })

  it("returns 'google' for /google/ad-groups", () => {
    mockUsePathname.mockReturnValue("/google/ad-groups")
    expect(usePlatform().platform).toBe("google")
  })

  it("returns 'meta' for /campaigns (existing Meta URL)", () => {
    mockUsePathname.mockReturnValue("/campaigns")
    expect(usePlatform().platform).toBe("meta")
  })

  it("returns 'meta' for / (shared dashboard)", () => {
    mockUsePathname.mockReturnValue("/")
    expect(usePlatform().platform).toBe("meta")
  })

  it("returns 'meta' for /settings (shared page)", () => {
    mockUsePathname.mockReturnValue("/settings")
    expect(usePlatform().platform).toBe("meta")
  })

  it("returns 'meta' for /insights (shared page)", () => {
    mockUsePathname.mockReturnValue("/insights")
    expect(usePlatform().platform).toBe("meta")
  })
})

describe("getDefaultPlatform / setDefaultPlatform", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("defaults to meta when nothing stored", () => {
    expect(getDefaultPlatform()).toBe("meta")
  })

  it("returns stored platform", () => {
    setDefaultPlatform("google")
    expect(getDefaultPlatform()).toBe("google")
  })

  it("persists to localStorage", () => {
    setDefaultPlatform("google")
    expect(localStorage.getItem("adsflow-platform")).toBe("google")
  })
})

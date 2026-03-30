import { describe, it, expect } from "vitest"
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils"

describe("cn (className merge)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("deduplicates tailwind classes", () => {
    const result = cn("p-4", "p-2")
    expect(result).toBe("p-2")
  })
})

describe("formatCurrency", () => {
  it("formats INR values", () => {
    const result = formatCurrency(1500)
    expect(result).toContain("1,500")
  })

  it("handles zero", () => {
    const result = formatCurrency(0)
    expect(result).toContain("0")
  })

  it("handles decimals", () => {
    const result = formatCurrency(12.5)
    expect(result).toBeDefined()
  })
})

describe("formatNumber", () => {
  it("formats numbers with commas", () => {
    const result = formatNumber(1000000)
    expect(result).toContain("1,000,000")
  })

  it("handles zero", () => {
    expect(formatNumber(0)).toBe("0")
  })

  it("uses compact notation for large numbers", () => {
    const result = formatNumber(1500000, true)
    expect(result).toContain("1.5M")
  })
})

describe("formatPercent", () => {
  it("formats with 2 decimal places", () => {
    expect(formatPercent(3.14159)).toBe("3.14%")
  })

  it("pads to 2 decimals", () => {
    expect(formatPercent(5)).toBe("5.00%")
  })

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("0.00%")
  })
})

import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AiInsightCard } from "@/components/dashboard/AiInsightCard"

describe("AiInsightCard", () => {
  it("renders title and body", () => {
    render(
      <AiInsightCard
        type="ai"
        tag="AI Insight"
        title="Reduce budget on underperformers"
        body="Campaign X has a CPL 3x higher than average."
      />
    )
    expect(screen.getByText("Reduce budget on underperformers")).toBeInTheDocument()
    expect(screen.getByText(/Campaign X has a CPL/)).toBeInTheDocument()
  })

  it("renders tag text", () => {
    render(
      <AiInsightCard type="budget" tag="Budget Alert" title="Test" body="Test body" />
    )
    expect(screen.getByText("Budget Alert")).toBeInTheDocument()
  })

  it("renders CTA button when provided", () => {
    render(
      <AiInsightCard
        type="opportunity"
        tag="Opportunity"
        title="Test"
        body="Body"
        ctaLabel="Apply Suggestion"
      />
    )
    expect(screen.getByText("Apply Suggestion")).toBeInTheDocument()
  })

  it("renders dismiss button when onDismiss provided", () => {
    render(
      <AiInsightCard
        type="warning"
        tag="Warning"
        title="Test"
        body="Body"
        onDismiss={() => {}}
      />
    )
    // Dismiss button renders as an X icon button
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("uses top-border treatment (not left-border)", () => {
    const { container } = render(
      <AiInsightCard type="ai" tag="AI" title="Test" body="Body" />
    )
    const card = container.firstChild as HTMLElement
    expect(card.style.borderTop).toContain("2px solid")
    expect(card.style.borderLeft).toBeFalsy()
  })
})

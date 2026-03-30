import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { LayoutDashboard, Megaphone } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorBanner } from "@/components/ui/error-banner"

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        icon={LayoutDashboard}
        title="No campaigns yet"
        description="Sync your ad account to see campaigns"
      />
    )
    expect(screen.getByText("No campaigns yet")).toBeInTheDocument()
    expect(screen.getByText("Sync your ad account to see campaigns")).toBeInTheDocument()
  })

  it("renders action button when provided", () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        icon={Megaphone}
        title="Empty"
        description="Nothing here"
        actionLabel="Create Campaign"
        onAction={onAction}
      />
    )
    const button = screen.getByText("Create Campaign")
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("does not render button without actionLabel", () => {
    render(
      <EmptyState icon={LayoutDashboard} title="Empty" description="Nothing" />
    )
    expect(screen.queryByRole("button")).toBeNull()
  })
})

describe("ErrorBanner", () => {
  it("renders error message", () => {
    render(<ErrorBanner message="Something went wrong" />)
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
  })

  it("has alert role for accessibility", () => {
    render(<ErrorBanner message="Error" />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("renders retry button when onRetry provided", () => {
    const onRetry = vi.fn()
    render(<ErrorBanner message="Failed" onRetry={onRetry} />)
    const retryBtn = screen.getByText("Retry")
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("renders dismiss button when onDismiss provided", () => {
    const onDismiss = vi.fn()
    render(<ErrorBanner message="Error" onDismiss={onDismiss} />)
    const dismissBtn = screen.getByLabelText("Dismiss error")
    fireEvent.click(dismissBtn)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

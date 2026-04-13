"use client"

import { Component, type ReactNode } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-6 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--red-bg)" }}
          >
            <AlertCircle size={24} style={{ color: "var(--red-text)" }} />
          </div>
          <div>
            <h2 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Something went wrong
            </h2>
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-colors"
            style={{ background: "var(--acc)", color: "white" }}
          >
            <RefreshCw size={12} />
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

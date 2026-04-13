import { DashboardShell } from "@/components/layout/DashboardShell"
import { ToastContainer } from "@/components/layout/ErrorToast"
import { CommandPalette } from "@/components/layout/CommandPalette"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CommandPalette />
      <DashboardShell>
        <ErrorBoundary>{children}</ErrorBoundary>
      </DashboardShell>
      <ToastContainer />
    </>
  )
}

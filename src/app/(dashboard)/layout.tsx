import { DashboardShell } from "@/components/layout/DashboardShell"
import { ToastContainer } from "@/components/layout/ErrorToast"
import { CommandPalette } from "@/components/layout/CommandPalette"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CommandPalette />
      <DashboardShell>{children}</DashboardShell>
      <ToastContainer />
    </>
  )
}

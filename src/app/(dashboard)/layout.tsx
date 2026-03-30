import { DashboardShell } from "@/components/layout/DashboardShell"
import { ToastContainer } from "@/components/layout/ErrorToast"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <ToastContainer />
    </>
  )
}

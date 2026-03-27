import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { ToastContainer } from "@/components/layout/ErrorToast"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main
          className="flex-1 overflow-y-auto pb-16 md:pb-0"
          style={{
            background: "var(--bg-page)",
            padding: "20px 16px",
          }}
        >
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}

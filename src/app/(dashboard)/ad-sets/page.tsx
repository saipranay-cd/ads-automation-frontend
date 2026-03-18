export default function AdSetsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2
        className="text-[15px] font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        Ad Sets
      </h2>
      <div
        className="flex h-[200px] items-center justify-center rounded-lg"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Ad Sets management — coming soon
        </span>
      </div>
    </div>
  )
}

"use client"

interface StatusTabsProps<T extends string> {
  tabs: readonly T[]
  active: T
  onChange: (tab: T) => void
}

export function StatusTabs<T extends string>({ tabs, active, onChange }: StatusTabsProps<T>) {
  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className="rounded-md px-3 py-1.5 text-xs font-medium transition-[background-color,color] duration-200"
          style={{
            background: active === tab ? "var(--acc-subtle)" : "transparent",
            color: active === tab ? "var(--acc-text)" : "var(--text-secondary)",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

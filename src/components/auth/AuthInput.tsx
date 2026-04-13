"use client"

interface AuthInputProps {
  id: string
  label: string
  type?: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function AuthInput({ id, label, type = "text", required, value, onChange, placeholder }: AuthInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--acc)] focus:shadow-[0_0_0_1px_var(--acc)]"
      />
    </div>
  )
}

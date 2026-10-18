import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: React.ReactNode
}

// Sleek custom dark dropdown — replaces ugly native <select> styling while keeping
// keyboard-free click interaction and closing on outside click.
export default function Dropdown({
  value,
  options,
  onChange,
  className = '',
  menuClassName = '',
  ariaLabel,
}: {
  value: string
  options: DropdownOption[]
  onChange: (v: string) => void
  className?: string
  menuClassName?: string
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const current = options.find((o) => o.value === value)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 bg-bar text-gray-200 rounded-pill px-3 py-1.5 hover:bg-bar/70 transition-colors ${className}`}
      >
        <span className="flex items-center gap-1.5">{current?.label ?? value}</span>
        <ChevronDown size={13} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className={`absolute right-0 mt-1.5 min-w-full bg-[#262135] border border-white/10 rounded-lg shadow-2xl p-1 z-50 ${menuClassName}`}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className={`flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
                o.value === value ? 'bg-bar text-gold' : 'text-gray-200 hover:bg-bar'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// components/applications/FormFieldWrapper.tsx
import React from 'react'
import { LucideIcon } from 'lucide-react'

interface FormFieldWrapperProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}

export function FormFieldWrapper({
  label,
  required = false,
  error,
  hint,
  icon: Icon,
  children,
  className = '',
}: FormFieldWrapperProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
        <span>{label}</span>
        {required && <span className="text-rose-500">*</span>}
      </label>

      <div>{children}</div>

      {hint && !error && (
        <p className="text-[11px] text-slate-500 leading-tight">{hint}</p>
      )}

      {error && (
        <p className="text-[11px] text-rose-600 font-medium leading-tight">{error}</p>
      )}
    </div>
  )
}

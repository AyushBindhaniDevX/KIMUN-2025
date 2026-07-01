'use client'

import React, { useState, useMemo } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { countryToISO, getCountryCode } from '@/utils/countryCodes'
import * as Flags from 'country-flag-icons/react/3x2'

interface CountrySelectProps {
  value: string
  onChange: (country: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function CountrySelect({ value, onChange, placeholder = 'Select country...', className = '', disabled = false }: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const countries = useMemo(() => Object.keys(countryToISO).sort(), [])

  const filtered = useMemo(() =>
    countries.filter(c => c.toLowerCase().includes(query.toLowerCase())),
    [countries, query]
  )

  const code = value ? getCountryCode(value) : null
  const FlagComponent = code ? (Flags as any)[code] : null

  const handleSelect = (country: string) => {
    onChange(country)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={`w-full flex items-center gap-3 bg-slate-100 border rounded-xl px-4 py-2.5 text-sm text-left transition-all outline-none ${
          open ? 'ring-2 ring-indigo-500 border-indigo-300 bg-white' : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {value && FlagComponent ? (
          <>
            <div className="w-7 h-5 rounded overflow-hidden shrink-0 border border-slate-200/60">
              <FlagComponent title={value} className="w-full h-full object-cover" />
            </div>
            <span className="flex-1 font-semibold text-slate-800 truncate">{value}</span>
          </>
        ) : (
          <span className="flex-1 text-slate-400">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span onClick={handleClear} className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search country..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-700"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">No countries found</div>
            ) : (
              filtered.map(country => {
                const iso = getCountryCode(country)
                const Flag = (Flags as any)[iso]
                return (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-indigo-50 transition-colors text-left ${
                      value === country ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <div className="w-7 h-5 rounded overflow-hidden shrink-0 border border-slate-200/60">
                      {Flag ? <Flag title={country} className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">{iso}</div>
                      )}
                    </div>
                    <span className="truncate">{country}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

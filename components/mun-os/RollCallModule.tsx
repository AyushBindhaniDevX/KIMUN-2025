'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { SessionDelegate } from '@/app/eb-portal/session/page'
import { getCountryCode } from '@/utils/countryCodes'
import * as Flags from 'country-flag-icons/react/3x2'

function CountryFlag({ countryCode, country }: { countryCode?: string, country?: string }) {
  const code = countryCode || getCountryCode(country || '')
  const FlagComponent = (Flags as any)[code]
  
  if (!FlagComponent) {
    return (
      <div className="w-10 h-7 rounded bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
        {code}
      </div>
    )
  }

  return (
    <div className="w-10 h-7 rounded overflow-hidden shadow-sm border border-slate-200/60 shrink-0">
      <FlagComponent title={country} className="w-full h-full object-cover" />
    </div>
  )
}

interface RollCallModuleProps {
  role: 'eb' | 'delegate'
  delegates: SessionDelegate[]
  sessionState: any
  setSessionState?: (state: any) => void
}

export default function RollCallModule({ role, delegates, sessionState, setSessionState }: RollCallModuleProps) {
  
  const handleSetStatus = (delegateId: string, status: 'P' | 'P+V' | 'Absent') => {
    if (role !== 'eb' || !setSessionState) return
    const newRollCall = { ...sessionState.rollCall, [delegateId]: status }
    setSessionState({ rollCall: newRollCall })
  }

  const presentCount = Object.values(sessionState.rollCall || {}).filter((s: any) => s === 'P' || s === 'P+V').length
  const pvCount = Object.values(sessionState.rollCall || {}).filter((s: any) => s === 'P+V').length
  const totalCount = delegates.length
  const quorumPct = totalCount > 0 ? (presentCount / totalCount) * 100 : 0
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Roll Call</h2>
          <p className="text-sm text-slate-500 mt-0.5">Mark delegate attendance before starting the session.</p>
        </div>
        
        <div className="flex gap-3 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-center min-w-[110px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Present</p>
            <p className="text-2xl font-black text-indigo-600">{presentCount}<span className="text-slate-400 font-normal text-lg">/{totalCount}</span></p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-center min-w-[110px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">P + Voting</p>
            <p className="text-2xl font-black text-emerald-600">{pvCount}</p>
          </div>
        </div>
      </div>

      {/* Quorum Progress */}
      <div className="px-8 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
        <span className="text-xs font-semibold text-slate-500 shrink-0">Quorum</span>
        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full rounded-full transition-colors ${quorumPct >= 50 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            animate={{ width: `${quorumPct}%` }}
            transition={{ type: 'spring', damping: 20 }}
          />
        </div>
        <span className={`text-xs font-bold shrink-0 ${quorumPct >= 50 ? 'text-emerald-600' : 'text-slate-500'}`}>
          {quorumPct >= 50 ? '✓ Quorum Met' : `${quorumPct.toFixed(0)}%`}
        </span>
      </div>

      {/* Delegates List */}
      <div className="flex-1 overflow-y-auto">
        {delegates.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="font-semibold">No delegates found for this committee.</p>
            <p className="text-sm mt-1 text-slate-300">Ensure delegates are registered in the system.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {delegates.map((del, i) => {
              const status = sessionState.rollCall?.[del.id] || 'Absent'
              const isPresent = status !== 'Absent'
              return (
                <motion.div
                  key={del.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center justify-between px-8 py-3.5 transition-colors ${isPresent ? 'bg-indigo-50/40' : 'hover:bg-slate-50/60'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-slate-300 text-xs font-mono w-5 shrink-0">{(i+1).toString().padStart(2, '0')}</span>
                    <CountryFlag countryCode={del.countryCode} country={del.country} />
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{del.country}</p>
                      <p className="text-xs text-slate-400">{del.name}{del.isDoubleDel && del.coDelegate ? ` & ${del.coDelegate.name}` : ''}</p>
                    </div>
                  </div>

                  {role === 'eb' ? (
                    <div className="flex items-center gap-2">
                      {(['P', 'P+V', 'Absent'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSetStatus(del.id, s)}
                          className={`px-3 h-8 rounded-lg text-xs font-bold transition-all border ${
                            status === s
                              ? s === 'Absent'
                                ? 'bg-slate-200 text-slate-700 border-slate-300'
                                : 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                      status === 'P+V' ? 'bg-emerald-100 text-emerald-700' : 
                      status === 'P' ? 'bg-indigo-100 text-indigo-700' : 
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {status}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

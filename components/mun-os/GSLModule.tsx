'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Play, Pause, SkipForward, Plus, X, Users } from 'lucide-react'
import type { SessionDelegate } from '@/app/eb-portal/session/page'
import { getCountryCode } from '@/utils/countryCodes'
import * as Flags from 'country-flag-icons/react/3x2'

function CountryFlag({ countryCode, country, size = 'sm' }: { countryCode?: string, country?: string, size?: 'sm' | 'lg' }) {
  const code = countryCode || getCountryCode(country || '')
  const FlagComponent = (Flags as any)[code]
  const cls = size === 'lg' ? 'w-20 h-14' : 'w-9 h-6'
  if (!FlagComponent) return (
    <div className={`${cls} rounded bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0`}>{code}</div>
  )
  return (
    <div className={`${cls} rounded overflow-hidden shadow border border-slate-200/60 shrink-0`}>
      <FlagComponent title={country} className="w-full h-full object-cover" />
    </div>
  )
}

interface GSLModuleProps {
  role: 'eb' | 'delegate'
  delegates: SessionDelegate[]
  sessionState: any
  setSessionState?: (s: any) => void
}

export default function GSLModule({ role, delegates, sessionState, setSessionState }: GSLModuleProps) {
  const [now, setNow] = useState(Date.now())
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const gsl = sessionState?.gsl || {}
  const queue: string[] = gsl.queue || []
  const current: string = gsl.currentSpeaker || ''
  const isRunning: boolean = gsl.isTimerRunning || false
  const timerStart: number = gsl.timerStart || 0
  const timeLimit: number = gsl.timeLimit || 90
  const elapsed = isRunning ? Math.floor((now - timerStart) / 1000) : 0
  const remaining = Math.max(0, timeLimit - elapsed)
  const progressPct = timeLimit > 0 ? ((timeLimit - remaining) / timeLimit) * 100 : 0

  const currentDel = delegates.find(d => d.id === current)

  const update = (patch: any) => {
    if (!setSessionState) return
    setSessionState({ gsl: { ...gsl, ...patch } })
  }

  const handleStart = () => update({ isTimerRunning: true, timerStart: Date.now() })
  const handlePause = () => update({ isTimerRunning: false, timeLimit: remaining })
  const handleNext = () => {
    const newQueue = [...queue]
    const next = newQueue.shift() || ''
    update({ currentSpeaker: next, queue: newQueue, isTimerRunning: false, timerStart: 0, timeLimit: 90 })
  }
  const handleAdd = (id: string) => {
    if (queue.includes(id) || id === current) return
    update({ queue: [...queue, id] })
    setShowAdd(false)
    setSearch('')
  }
  const handleRemove = (id: string) => update({ queue: queue.filter((q: string) => q !== id) })

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const filtered = delegates.filter(d => d.country.toLowerCase().includes(search.toLowerCase()) || d.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Mic className="w-5 h-5 text-indigo-600" />
            <h2 className="text-2xl font-bold text-slate-900">General Speakers List</h2>
          </div>
          <p className="text-sm text-slate-500">{queue.length} speakers queued · {timeLimit}s per speech</p>
        </div>
        {role === 'eb' && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Speaker
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Timer Panel */}
        <div className="w-[300px] border-r border-slate-100 flex flex-col items-center justify-center p-8 gap-6 shrink-0 bg-slate-50/30">
          {currentDel ? (
            <div className="flex flex-col items-center gap-3">
              <CountryFlag countryCode={currentDel.countryCode} country={currentDel.country} size="lg" />
              <div className="text-center">
                <h3 className="font-black text-xl text-slate-900">{currentDel.country}</h3>
                <p className="text-sm text-slate-500">{currentDel.name}</p>
              </div>
            </div>
          ) : (
            <div className="text-center opacity-40">
              <div className="w-20 h-14 rounded bg-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">No Active Speaker</p>
            </div>
          )}

          {/* Circular Timer */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <circle cx="50" cy="50" r="44" fill="none"
                stroke={remaining < 15 ? '#ef4444' : '#6366f1'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${276 * (1 - progressPct / 100)} 276`}
                className="transition-all duration-1000"
              />
            </svg>
            <span className={`text-3xl font-black tabular-nums font-mono z-10 ${remaining < 15 ? 'text-red-500' : 'text-slate-900'}`}>
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
          </div>

          {role === 'eb' && (
            <div className="flex gap-3">
              {!isRunning ? (
                <button onClick={handleStart} disabled={!current} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-sm">
                  <Play className="w-4 h-4 fill-white" /> Start
                </button>
              ) : (
                <button onClick={handlePause} className="flex items-center gap-2 px-5 py-2 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-all shadow-sm">
                  <Pause className="w-4 h-4 fill-white" /> Pause
                </button>
              )}
              <button onClick={handleNext} className="p-2.5 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Queue */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Speaker Queue</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 py-12">
                <Users className="w-10 h-10 text-slate-200" />
                <p className="font-semibold">Queue is empty</p>
              </div>
            ) : (
              queue.map((id: string, i: number) => {
                const del = delegates.find(d => d.id === id)
                if (!del) return null
                return (
                  <div key={id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    <CountryFlag countryCode={del.countryCode} country={del.country} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{del.country}</p>
                      <p className="text-xs text-slate-400 truncate">{del.name}</p>
                    </div>
                    {role === 'eb' && (
                      <button onClick={() => handleRemove(id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowAdd(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Add to GSL</h3>
                <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search delegates..."
                  className="w-full bg-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-3" autoFocus />
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                  {filtered.map(del => {
                    const inQ = queue.includes(del.id) || del.id === current
                    return (
                      <button key={del.id} onClick={() => handleAdd(del.id)} disabled={inQ}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${inQ ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-50'}`}
                      >
                        <CountryFlag countryCode={del.countryCode} country={del.country} />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{del.country}</p>
                          <p className="text-xs text-slate-400">{del.name}</p>
                        </div>
                        {inQ && <span className="ml-auto text-xs text-slate-400 font-semibold">In Queue</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

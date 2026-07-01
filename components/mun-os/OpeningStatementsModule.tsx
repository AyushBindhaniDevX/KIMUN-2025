'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, Play, Pause, SkipForward, Plus, X, Users } from 'lucide-react'
import type { SessionDelegate } from '@/app/eb-portal/session/page'

interface OpeningStatementsModuleProps {
  role: 'eb' | 'delegate'
  delegates: SessionDelegate[]
  sessionState: any
  setSessionState?: (s: any) => void
}

export default function OpeningStatementsModule({ role, delegates, sessionState, setSessionState }: OpeningStatementsModuleProps) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const os = sessionState?.openingStatements || {}
  const queue: string[] = os.queue || []
  const completed: string[] = os.completed || []
  const current: string = os.currentParty || ''
  const isRunning: boolean = os.isTimerRunning || false
  const timerStart: number = os.timerStart || 0
  const timeLimit: number = os.timeLimit || 120

  const elapsed = isRunning ? Math.floor((now - timerStart) / 1000) : 0
  const remaining = Math.max(0, timeLimit - elapsed)
  const progressPct = timeLimit > 0 ? ((timeLimit - remaining) / timeLimit) * 100 : 0
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  const currentDel = delegates.find(d => d.id === current)

  const update = (patch: any) => {
    if (!setSessionState) return
    setSessionState({ openingStatements: { ...os, ...patch } })
  }

  const handleStart = () => update({ isTimerRunning: true, timerStart: Date.now() })
  const handlePause = () => update({ isTimerRunning: false, timeLimit: remaining })
  const handleNext = () => {
    const newQueue = [...queue]
    const newCompleted = current ? [...completed, current] : completed
    const next = newQueue.shift() || ''
    update({ currentParty: next, queue: newQueue, completed: newCompleted, isTimerRunning: false, timerStart: 0, timeLimit: 120 })
  }
  const handleAddToQueue = (id: string) => {
    if (queue.includes(id) || id === current || completed.includes(id)) return
    update({ queue: [...queue, id] })
  }

  // Parties not yet in queue/current/completed
  const available = delegates.filter(d => !queue.includes(d.id) && d.id !== current && !completed.includes(d.id))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Opening Statements</h2>
          <p className="text-sm text-slate-500 mt-0.5">Each party states their position on the agenda.</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <span className="font-bold text-slate-800">{completed.length}</span> completed · <span className="font-bold text-slate-800">{queue.length}</span> queued
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Timer Panel */}
        <div className="w-[300px] border-r border-slate-100 flex flex-col items-center justify-center p-8 gap-6 shrink-0 bg-gradient-to-b from-orange-50/30 to-white">
          {currentDel ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Mic className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-black text-xl text-slate-900">{currentDel.country}</h3>
              <p className="text-sm text-slate-500">{currentDel.name}</p>
            </div>
          ) : (
            <div className="text-center opacity-40">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Mic className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No Active Speaker</p>
            </div>
          )}

          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#fed7aa" strokeWidth="8" />
              <circle cx="50" cy="50" r="44" fill="none"
                stroke={remaining < 20 ? '#ef4444' : '#f97316'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${276 * (1 - progressPct / 100)} 276`}
                className="transition-all duration-1000"
              />
            </svg>
            <span className={`text-3xl font-black tabular-nums font-mono z-10 ${remaining < 20 ? 'text-red-500' : 'text-orange-700'}`}>
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
          </div>

          {role === 'eb' && (
            <div className="flex gap-3">
              {!isRunning ? (
                <button onClick={handleStart} disabled={!current} className="flex items-center gap-2 px-5 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 disabled:opacity-40 shadow-sm transition-all">
                  <Play className="w-4 h-4 fill-white" /> Start
                </button>
              ) : (
                <button onClick={handlePause} className="flex items-center gap-2 px-5 py-2 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 shadow-sm transition-all">
                  <Pause className="w-4 h-4 fill-white" /> Pause
                </button>
              )}
              <button onClick={handleNext} className="p-2.5 border-2 border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Queue + Available */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Queue */}
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Queue ({queue.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {queue.length === 0 && available.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400">
                <Users className="w-8 h-8 text-slate-200" />
                <p className="text-sm font-semibold">All parties have spoken</p>
              </div>
            ) : (
              <>
                {queue.map((id, i) => {
                  const del = delegates.find(d => d.id === id)
                  if (!del) return null
                  return (
                    <div key={id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50/50">
                      <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm">{del.country}</p>
                        <p className="text-xs text-slate-400">{del.name}</p>
                      </div>
                      {role === 'eb' && (
                        <button onClick={() => update({ queue: queue.filter(q => q !== id) })} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
                {/* Available parties to add */}
                {role === 'eb' && available.length > 0 && (
                  <>
                    <div className="px-6 py-2 bg-slate-50 border-y border-slate-100">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-300">Available</p>
                    </div>
                    {available.map(del => (
                      <div key={del.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50/50 opacity-60">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                          <Plus className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-700 text-sm">{del.country}</p>
                          <p className="text-xs text-slate-400">{del.name}</p>
                        </div>
                        <button onClick={() => handleAddToQueue(del.id)} className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-700 rounded-lg transition-colors">
                          Add
                        </button>
                      </div>
                    ))}
                  </>
                )}
                {/* Completed */}
                {completed.length > 0 && (
                  <>
                    <div className="px-6 py-2 bg-slate-50 border-y border-slate-100">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-300">Completed</p>
                    </div>
                    {completed.map(id => {
                      const del = delegates.find(d => d.id === id)
                      if (!del) return null
                      return (
                        <div key={id} className="flex items-center gap-4 px-6 py-3 opacity-40">
                          <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <span className="text-emerald-500 font-black text-sm">✓</span>
                          </div>
                          <p className="font-bold text-slate-600 text-sm">{del.country}</p>
                        </div>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

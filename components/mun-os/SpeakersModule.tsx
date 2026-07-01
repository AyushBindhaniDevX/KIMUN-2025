'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipForward, Plus, X, Settings, Clock, Users, ChevronDown } from 'lucide-react'
import type { SessionDelegate } from '@/app/eb-portal/session/page'
import { getCountryCode } from '@/utils/countryCodes'
import * as Flags from 'country-flag-icons/react/3x2'

function CountryFlag({ countryCode, country, size = 'sm' }: { countryCode?: string, country?: string, size?: 'sm' | 'lg' }) {
  const code = countryCode || getCountryCode(country || '')
  const FlagComponent = (Flags as any)[code]
  const cls = size === 'lg' ? 'w-20 h-14' : 'w-9 h-6'
  
  if (!FlagComponent) {
    return (
      <div className={`${cls} rounded bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0`}>
        {code}
      </div>
    )
  }

  return (
    <div className={`${cls} rounded overflow-hidden shadow border border-slate-200/60 shrink-0`}>
      <FlagComponent title={country} className="w-full h-full object-cover" />
    </div>
  )
}

interface SpeakersModuleProps {
  role: 'eb' | 'delegate'
  delegates: SessionDelegate[]
  sessionState: any
  setSessionState?: (state: any) => void
}

export default function SpeakersModule({ role, delegates, sessionState, setSessionState }: SpeakersModuleProps) {
  const [now, setNow] = useState(Date.now())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [caucusType, setCaucusType] = useState<'mod' | 'unmod'>('mod')
  const [modTime, setModTime] = useState(60) // seconds per speaker
  const [unmodTime, setUnmodTime] = useState(600) // total unmod time in seconds
  const [totalModTime, setTotalModTime] = useState(600) // total mod caucus time

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const speakers = sessionState?.speakersList || {}
  const queue: string[] = speakers.queue || []
  const currentSpeaker: string = speakers.currentSpeaker || ''
  const isTimerRunning: boolean = speakers.isTimerRunning || false
  const timerStart: number = speakers.timerStart || 0
  const timeLimit: number = speakers.timeLimit || 90

  const elapsed = isTimerRunning ? Math.floor((now - timerStart) / 1000) : 0
  const remaining = Math.max(0, timeLimit - elapsed)
  const progressPct = timeLimit > 0 ? ((timeLimit - remaining) / timeLimit) * 100 : 0

  const currentDel = delegates.find(d => d.id === currentSpeaker)

  const handleStart = () => {
    if (role !== 'eb' || !setSessionState) return
    setSessionState({ speakersList: { ...speakers, isTimerRunning: true, timerStart: Date.now() } })
  }

  const handlePause = () => {
    if (role !== 'eb' || !setSessionState) return
    setSessionState({ speakersList: { ...speakers, isTimerRunning: false, timeLimit: remaining } })
  }

  const handleNext = () => {
    if (role !== 'eb' || !setSessionState) return
    const newQueue = [...queue]
    const next = newQueue.shift() || ''
    setSessionState({
      speakersList: {
        ...speakers,
        currentSpeaker: next,
        queue: newQueue,
        isTimerRunning: false,
        timerStart: 0,
        timeLimit: modTime
      }
    })
  }

  const handleAddSpeaker = (delegateId: string) => {
    if (!setSessionState) return
    if (queue.includes(delegateId) || delegateId === currentSpeaker) return
    const newQueue = [...queue, delegateId]
    setSessionState({ speakersList: { ...speakers, queue: newQueue } })
  }

  const handleRemoveSpeaker = (delegateId: string) => {
    if (role !== 'eb' || !setSessionState) return
    const newQueue = queue.filter(id => id !== delegateId)
    setSessionState({ speakersList: { ...speakers, queue: newQueue } })
  }

  const handleApplySettings = () => {
    if (!setSessionState) return
    setSessionState({
      speakersList: {
        ...speakers,
        timeLimit: modTime,
        isTimerRunning: false,
        timerStart: 0
      }
    })
    setShowSettingsModal(false)
  }

  const filteredDelegates = delegates.filter(d => 
    d.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getDelById = (id: string) => delegates.find(d => d.id === id)

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
      
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Speakers List</h2>
          <p className="text-sm text-slate-500 mt-0.5">{queue.length} in queue · {timeLimit}s per speaker</p>
        </div>
        <div className="flex gap-2">
          {role === 'eb' && (
            <>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Speaker
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Timer */}
        <div className="w-[320px] border-r border-slate-100 flex flex-col items-center justify-center p-8 gap-6 shrink-0 bg-slate-50/40">
          {currentDel ? (
            <div className="flex flex-col items-center gap-4 w-full">
              <CountryFlag countryCode={currentDel.countryCode} country={currentDel.country} size="lg" />
              <div className="text-center">
                <h3 className="font-black text-xl text-slate-900">{currentDel.country}</h3>
                <p className="text-sm text-slate-500">{currentDel.name}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-40">
              <div className="w-20 h-14 rounded bg-slate-200" />
              <p className="text-sm font-semibold text-slate-500">No Active Speaker</p>
            </div>
          )}

          {/* Timer Display */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke={remaining < 15 ? '#ef4444' : '#6366f1'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${276 * (1 - progressPct / 100)} 276`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="text-center z-10">
              <span className={`text-4xl font-black tabular-nums font-mono ${remaining < 15 ? 'text-red-500' : 'text-slate-900'}`}>
                {mins}:{secs.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {role === 'eb' && (
            <div className="flex gap-3 w-full justify-center">
              {!isTimerRunning ? (
                <button
                  onClick={handleStart}
                  disabled={!currentSpeaker}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-sm disabled:opacity-40 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" /> Start
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 shadow-sm transition-all"
                >
                  <Pause className="w-4 h-4 fill-white" /> Pause
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Queue */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Speaker Queue</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 py-12">
                <Users className="w-10 h-10 text-slate-200" />
                <p className="font-semibold">Queue is empty</p>
                {role === 'eb' && <p className="text-xs">Add speakers using the button above</p>}
              </div>
            ) : (
              queue.map((id, i) => {
                const del = getDelById(id)
                if (!del) return null
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    <CountryFlag countryCode={del.countryCode} country={del.country} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{del.country}</p>
                      <p className="text-xs text-slate-400 truncate">{del.name}</p>
                    </div>
                    {role === 'eb' && (
                      <button onClick={() => handleRemoveSpeaker(id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Speaker Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Add to Speakers List</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search delegates..."
                  className="w-full bg-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                  autoFocus
                />
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                  {filteredDelegates.map(del => {
                    const inQueue = queue.includes(del.id) || del.id === currentSpeaker
                    return (
                      <button
                        key={del.id}
                        onClick={() => { handleAddSpeaker(del.id); setShowAddModal(false); setSearchQuery('') }}
                        disabled={inQueue}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          inQueue ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-50'
                        }`}
                      >
                        <CountryFlag countryCode={del.countryCode} country={del.country} />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{del.country}</p>
                          <p className="text-xs text-slate-400">{del.name}</p>
                        </div>
                        {inQueue && <span className="ml-auto text-xs text-slate-400 font-semibold">In Queue</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900">Caucus Settings</h3>
                </div>
                <button onClick={() => setShowSettingsModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-5">
                {/* Caucus Type */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Caucus Type</p>
                  <div className="flex gap-2">
                    {(['mod', 'unmod'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setCaucusType(t)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                          caucusType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {t === 'mod' ? 'Moderated' : 'Unmoderated'}
                      </button>
                    ))}
                  </div>
                </div>

                {caucusType === 'mod' && (
                  <>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Caucus Time (minutes)</p>
                      <input
                        type="number"
                        value={totalModTime / 60}
                        onChange={(e) => setTotalModTime(parseInt(e.target.value) * 60 || 0)}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        min={1} max={60}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Speaking Time (seconds)</p>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {[30, 45, 60, 90, 120].map(t => (
                          <button
                            key={t}
                            onClick={() => setModTime(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              modTime === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {t}s
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={modTime}
                        onChange={(e) => setModTime(parseInt(e.target.value) || 60)}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        min={10} max={300}
                        placeholder="Custom seconds"
                      />
                    </div>
                  </>
                )}

                {caucusType === 'unmod' && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Unmod Time (minutes)</p>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {[5, 10, 15, 20, 30].map(t => (
                        <button
                          key={t}
                          onClick={() => setUnmodTime(t * 60)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            unmodTime === t * 60 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {t}m
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={unmodTime / 60}
                      onChange={(e) => setUnmodTime(parseInt(e.target.value) * 60 || 0)}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      min={1} max={60}
                      placeholder="Minutes"
                    />
                  </div>
                )}

                <button
                  onClick={handleApplySettings}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Apply Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, AlertCircle, HelpCircle, RotateCcw, Check, X, Plus } from 'lucide-react'
import type { SessionDelegate } from '@/app/eb-portal/session/page'

interface DebateFloorModuleProps {
  role: 'eb' | 'delegate'
  delegates: SessionDelegate[]
  sessionState: any
  setSessionState?: (s: any) => void
}

const POINT_TYPES = [
  { id: 'information', label: 'Point of Information', icon: HelpCircle, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'order', label: 'Point of Order', icon: AlertCircle, color: 'text-red-600 bg-red-50 border-red-200' },
  { id: 'reply', label: 'Right to Reply', icon: RotateCcw, color: 'text-orange-600 bg-orange-50 border-orange-200' },
]

export default function DebateFloorModule({ role, delegates, sessionState, setSessionState }: DebateFloorModuleProps) {
  const [showRaise, setShowRaise] = useState(false)
  const [selectedType, setSelectedType] = useState<'information' | 'order' | 'reply'>('information')
  const [selectedDelegate, setSelectedDelegate] = useState('')

  const points: any[] = sessionState?.points || []

  const handleRaisePoint = () => {
    if (!setSessionState || !selectedDelegate) return
    const del = delegates.find(d => d.id === selectedDelegate)
    const newPoint = {
      id: Date.now().toString(),
      type: selectedType,
      raisedBy: del?.country || selectedDelegate,
      status: 'pending',
      timestamp: Date.now()
    }
    setSessionState({ points: [...points, newPoint] })
    setShowRaise(false)
    setSelectedDelegate('')
  }

  const handleGrant = (id: string) => {
    if (!setSessionState) return
    setSessionState({ points: points.map((p: any) => p.id === id ? { ...p, status: 'granted' } : p) })
  }

  const handleDeny = (id: string) => {
    if (!setSessionState) return
    setSessionState({ points: points.map((p: any) => p.id === id ? { ...p, status: 'denied' } : p) })
  }

  const handleClear = () => {
    if (!setSessionState) return
    setSessionState({ points: points.filter((p: any) => p.status === 'pending') })
  }

  const pending = points.filter((p: any) => p.status === 'pending')
  const resolved = points.filter((p: any) => p.status !== 'pending')

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Debate Floor</h2>
            <p className="text-sm text-slate-500 mt-0.5">{pending.length} pending points</p>
          </div>
        </div>
        <button
          onClick={() => setShowRaise(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Raise Point
        </button>
      </div>

      {/* Point Types Legend */}
      <div className="px-8 py-3 border-b border-slate-100 bg-slate-50/40 flex gap-4 flex-wrap">
        {POINT_TYPES.map(pt => (
          <div key={pt.id} className="flex items-center gap-1.5">
            <pt.icon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">{pt.label}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {/* Pending Points */}
        {pending.length > 0 && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Pending ({pending.length})</p>
            <div className="space-y-2">
              {pending.map((point: any) => {
                const ptConfig = POINT_TYPES.find(p => p.id === point.type)
                const Icon = ptConfig?.icon || HelpCircle
                return (
                  <motion.div key={point.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${ptConfig?.color || 'bg-slate-50 border-slate-200'}`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">{ptConfig?.label}</p>
                      <p className="text-xs text-slate-600 mt-0.5">Raised by <span className="font-bold">{point.raisedBy}</span></p>
                    </div>
                    {role === 'eb' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleGrant(point.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700">
                          <Check className="w-3 h-3" /> Grant
                        </button>
                        <button onClick={() => handleDeny(point.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600">
                          <X className="w-3 h-3" /> Deny
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Resolved Points */}
        {resolved.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-300">Resolved ({resolved.length})</p>
              {role === 'eb' && (
                <button onClick={handleClear} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Clear</button>
              )}
            </div>
            <div className="space-y-2">
              {resolved.map((point: any) => {
                const ptConfig = POINT_TYPES.find(p => p.id === point.type)
                const Icon = ptConfig?.icon || HelpCircle
                return (
                  <div key={point.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 opacity-50">
                    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-600 text-sm">{ptConfig?.label} — <span className="text-slate-500">{point.raisedBy}</span></p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      point.status === 'granted' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {point.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {pending.length === 0 && resolved.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Flame className="w-12 h-12 text-slate-200" />
            <p className="font-semibold">No points raised</p>
            <p className="text-sm text-slate-300">Use the "Raise Point" button to submit a point.</p>
          </div>
        )}
      </div>

      {/* Raise Point Modal */}
      <AnimatePresence>
        {showRaise && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowRaise(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Raise a Point</h3>
                <button onClick={() => setShowRaise(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Point Type</p>
                  <div className="space-y-2">
                    {POINT_TYPES.map(pt => (
                      <button key={pt.id} onClick={() => setSelectedType(pt.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          selectedType === pt.id ? `${pt.color} border-current` : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <pt.icon className="w-4 h-4 shrink-0" />
                        <span className="font-semibold text-sm">{pt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Party / Delegate</p>
                  <select
                    value={selectedDelegate}
                    onChange={e => setSelectedDelegate(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Select delegate...</option>
                    {delegates.map(d => (
                      <option key={d.id} value={d.id}>{d.country} — {d.name}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleRaisePoint} disabled={!selectedDelegate}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 disabled:opacity-40 shadow-sm transition-colors"
                >
                  Submit Point
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

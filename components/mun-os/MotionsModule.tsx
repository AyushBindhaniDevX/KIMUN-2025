'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CountrySelect from '@/components/ui/CountrySelect'
import { Plus, X, Vote, Check, XCircle, Clock, MessageSquare } from 'lucide-react'
import { firebaseDb as database } from '@/lib/firebase-client'
import { ref, push, set } from 'firebase/database'

interface MotionsModuleProps {
  role: 'eb' | 'delegate'
  sessionState: any
  setSessionState?: (state: any) => void
  committeeId?: string | null
}

const MOTION_TYPES = [
  { id: 'mod_caucus', label: 'Moderated Caucus', shortLabel: 'Mod. Caucus' },
  { id: 'unmod_caucus', label: 'Unmoderated Caucus', shortLabel: 'Unmod. Caucus' },
  { id: 'extend', label: 'Extend Current Caucus', shortLabel: 'Extension' },
  { id: 'adjourn', label: 'Motion to Adjourn', shortLabel: 'Adjourn' },
  { id: 'recess', label: 'Motion to Recess', shortLabel: 'Recess' },
  { id: 'prev_question', label: 'Motion for Previous Question', shortLabel: 'Prev. Question' },
]

function NewMotionModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (motion: any) => void }) {
  const [form, setForm] = useState({
    type: 'mod_caucus',
    totalTime: '',
    speakerTime: '',
    topic: '',
    proposedBy: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...form,
      id: Date.now(),
      status: 'Pending',
      timestamp: Date.now()
    })
    onClose()
  }

  const selectedType = MOTION_TYPES.find(t => t.id === form.type)
  const isTimed = ['mod_caucus', 'unmod_caucus', 'extend'].includes(form.type)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Vote className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900">New Motion</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Motion Type */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Motion Type</label>
            <div className="grid grid-cols-2 gap-2">
              {MOTION_TYPES.map(type => (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => setForm(f => ({ ...f, type: type.id }))}
                  className={`p-3 rounded-xl text-left text-xs font-semibold border transition-all ${
                    form.type === type.id 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Proposed By */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Proposed By (Country)</label>
            <CountrySelect
              value={form.proposedBy}
              onChange={(c) => setForm(f => ({ ...f, proposedBy: c }))}
              placeholder="Select proposing country..."
            />
          </div>

          {/* Topic (for mod caucus) */}
          {form.type === 'mod_caucus' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Topic / Agenda</label>
              <input
                value={form.topic}
                onChange={(e) => setForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="e.g. Nuclear Non-Proliferation"
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Timing fields */}
          {isTimed && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Total Time (min)</label>
                <input
                  type="number"
                  value={form.totalTime}
                  onChange={(e) => setForm(f => ({ ...f, totalTime: e.target.value }))}
                  placeholder="10"
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  min={1} max={60}
                />
              </div>
              {form.type === 'mod_caucus' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Speaker Time (sec)</label>
                  <input
                    type="number"
                    value={form.speakerTime}
                    onChange={(e) => setForm(f => ({ ...f, speakerTime: e.target.value }))}
                    placeholder="60"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    min={10} max={300}
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-sm transition-colors mt-2"
          >
            Submit Motion to Floor
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function MotionsModule({ role, sessionState, setSessionState, committeeId }: MotionsModuleProps) {
  const [showModal, setShowModal] = useState(false)

  const motions: any[] = sessionState?.motions || []

  const handleAddMotion = (motion: any) => {
    if (!setSessionState) return
    const newMotions = [...motions, motion]
    setSessionState({ motions: newMotions })
  }

  const handleSetStatus = (motionId: number, status: string) => {
    if (role !== 'eb' || !setSessionState) return
    const newMotions = motions.map(m => m.id === motionId ? { ...m, status } : m)
    setSessionState({ motions: newMotions })
  }

  const handleRemove = (motionId: number) => {
    if (role !== 'eb' || !setSessionState) return
    setSessionState({ motions: motions.filter(m => m.id !== motionId) })
  }

  const statusConfig: Record<string, { color: string; label: string }> = {
    Pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'On Floor' },
    Passed: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Passed' },
    Failed: { color: 'bg-red-100 text-red-600 border-red-200', label: 'Failed' },
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Motions</h2>
          <p className="text-sm text-slate-500 mt-0.5">{motions.filter(m => m.status === 'Pending').length} on the floor</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Motion
        </button>
      </div>

      {/* Motions List */}
      <div className="flex-1 overflow-y-auto">
        {motions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Vote className="w-12 h-12 text-slate-200" />
            <p className="font-semibold">No motions on the floor</p>
            <p className="text-sm text-slate-300">Submit a motion to open debate.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 p-4 space-y-2">
            {[...motions].reverse().map(m => {
              const sc = statusConfig[m.status] || statusConfig.Pending
              const typeLabel = MOTION_TYPES.find(t => t.id === m.type)?.label || m.type
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-xl border transition-all ${
                    m.status === 'Pending' ? 'bg-white border-slate-200 shadow-sm' : 
                    m.status === 'Passed' ? 'bg-emerald-50/50 border-emerald-100' : 
                    'bg-slate-50 border-slate-100 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${sc.color}`}>
                          {sc.label}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {typeLabel}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-base leading-tight">
                        {m.topic || typeLabel}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Proposed by <span className="font-bold text-indigo-600 ml-1">{m.proposedBy}</span>
                        </span>
                        {m.totalTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {m.totalTime} min total
                            {m.speakerTime && ` · ${m.speakerTime}s/speaker`}
                          </span>
                        )}
                      </div>
                    </div>

                    {role === 'eb' && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {m.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleSetStatus(m.id, 'Passed')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Pass
                            </button>
                            <button
                              onClick={() => handleSetStatus(m.id, 'Failed')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Fail
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleRemove(m.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <NewMotionModal onClose={() => setShowModal(false)} onSubmit={handleAddMotion} />
        )}
      </AnimatePresence>
    </div>
  )
}

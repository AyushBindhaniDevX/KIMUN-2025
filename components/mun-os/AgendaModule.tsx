'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Check, ChevronRight, Vote, Plus, X } from 'lucide-react'

interface AgendaModuleProps {
  role: 'eb' | 'delegate'
  sessionState: any
  setSessionState?: (s: any) => void
  committeeName?: string
}

export default function AgendaModule({ role, sessionState, setSessionState, committeeName }: AgendaModuleProps) {
  const [newTopic, setNewTopic] = useState('')
  const [showVote, setShowVote] = useState<number | null>(null)

  const agenda = sessionState?.agenda || { topics: [], activeTopicIndex: null, isSet: false }
  const topics: string[] = agenda.topics || []

  const handleAddTopic = () => {
    if (!newTopic.trim() || !setSessionState) return
    const updated = [...topics, newTopic.trim()]
    setSessionState({ agenda: { ...agenda, topics: updated } })
    setNewTopic('')
  }

  const handleSetActive = (idx: number) => {
    if (!setSessionState) return
    setSessionState({ agenda: { ...agenda, activeTopicIndex: idx, isSet: true } })
    setShowVote(null)
  }

  const handleRemove = (idx: number) => {
    if (!setSessionState) return
    const updated = topics.filter((_, i) => i !== idx)
    setSessionState({ agenda: { ...agenda, topics: updated, activeTopicIndex: null, isSet: false } })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Agenda Setting</h2>
          <p className="text-sm text-slate-500 mt-0.5">Determine the order of debate topics.</p>
        </div>
        {agenda.isSet && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">Agenda Set</span>
          </div>
        )}
      </div>

      <div className="p-8 space-y-6">
        {/* Active Agenda */}
        {agenda.isSet && agenda.activeTopicIndex !== null && (
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Now Debating</p>
            <h3 className="text-xl font-black text-indigo-900">{topics[agenda.activeTopicIndex]}</h3>
          </div>
        )}

        {/* Topics List */}
        <div className="space-y-3">
          {topics.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="font-semibold">No agenda topics yet</p>
              {role === 'eb' && <p className="text-sm">Add topics using the form below.</p>}
            </div>
          ) : (
            topics.map((topic, idx) => {
              const isActive = agenda.activeTopicIndex === idx && agenda.isSet
              return (
                <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isActive ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <p className={`flex-1 font-semibold ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{topic}</p>
                  
                  {role === 'eb' && !isActive && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSetActive(idx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Vote className="w-3 h-3" /> Set Active
                      </button>
                      <button
                        onClick={() => handleRemove(idx)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {isActive && (
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">Active</span>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Add Topic Form (EB only) */}
        {role === 'eb' && (
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
              placeholder="Add agenda topic (e.g. Climate Crisis)"
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button
              onClick={handleAddTopic}
              disabled={!newTopic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-40"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

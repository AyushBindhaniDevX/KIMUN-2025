'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Archive, Clock, Vote, Users, FileText, ChevronRight } from 'lucide-react'
import { firebaseDb as database } from '@/lib/firebase-client'
import { ref, get } from 'firebase/database'

interface ArchivesModuleProps {
  committeeId: string | null
  sessionState: any
}

interface ArchivedItem {
  type: 'motion' | 'resolution' | 'document' | 'roll_call'
  title: string
  detail: string
  timestamp: number
  status?: string
}

export default function ArchivesModule({ committeeId, sessionState }: ArchivesModuleProps) {
  const [filter, setFilter] = useState<'all' | 'motion' | 'document' | 'roll_call'>('all')

  // Build archive from current session state
  const archives: ArchivedItem[] = []

  // Past motions
  const motions: any[] = sessionState?.motions || []
  motions.forEach(m => {
    if (m.status !== 'Pending') {
      archives.push({
        type: 'motion',
        title: m.topic || m.type,
        detail: `Proposed by ${m.proposedBy} · ${m.status}`,
        timestamp: m.timestamp || Date.now(),
        status: m.status
      })
    }
  })

  // Documents pushed
  if (sessionState?.activeDocument) {
    archives.push({
      type: 'document',
      title: sessionState.activeDocument,
      detail: 'Pushed to delegates',
      timestamp: Date.now()
    })
  }

  // Roll call summary
  const rollCall = sessionState?.rollCall || {}
  const rollCallKeys = Object.keys(rollCall)
  if (rollCallKeys.length > 0) {
    const present = rollCallKeys.filter(k => rollCall[k] !== 'Absent').length
    archives.push({
      type: 'roll_call',
      title: 'Roll Call Recorded',
      detail: `${present} / ${rollCallKeys.length} present`,
      timestamp: Date.now()
    })
  }

  const filtered = filter === 'all' ? archives : archives.filter(a => a.type === filter)

  const iconMap = {
    motion: <Vote className="w-4 h-4 text-indigo-500" />,
    document: <FileText className="w-4 h-4 text-amber-500" />,
    roll_call: <Users className="w-4 h-4 text-emerald-500" />,
    resolution: <FileText className="w-4 h-4 text-purple-500" />
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return `${d.toLocaleDateString()} · ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const tabs: Array<{ id: typeof filter, label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'motion', label: 'Motions' },
    { id: 'document', label: 'Documents' },
    { id: 'roll_call', label: 'Roll Call' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Archives</h2>
          <p className="text-sm text-slate-500 mt-0.5">Session history for {committeeId}</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Archive className="w-12 h-12 text-slate-200" />
            <p className="font-semibold">No archived items yet</p>
            <p className="text-sm text-slate-300">Session events will appear here as they occur.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {[...filtered].reverse().map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-8 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  item.type === 'motion' ? 'bg-indigo-50' :
                  item.type === 'document' ? 'bg-amber-50' :
                  item.type === 'roll_call' ? 'bg-emerald-50' : 'bg-purple-50'
                }`}>
                  {iconMap[item.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{item.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-slate-400 truncate">{item.detail}</p>
                    {item.status && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                        item.status === 'Passed' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'Failed' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatDate(item.timestamp)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

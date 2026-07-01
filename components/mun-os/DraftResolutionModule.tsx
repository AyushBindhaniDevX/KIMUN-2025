'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, Plus, X, Check, ChevronDown, ChevronRight, FileText, Users } from 'lucide-react'
import { firebaseDb as database } from '@/lib/firebase-client'
import { ref, push, set } from 'firebase/database'

interface DraftResolutionModuleProps {
  role: 'eb' | 'delegate'
  sessionState: any
  setSessionState?: (s: any) => void
  committeeId?: string | null
}

function ClauseEditor({ clauses, onChange, placeholder }: { clauses: string[], onChange: (c: string[]) => void, placeholder: string }) {
  const add = () => onChange([...clauses, ''])
  const remove = (i: number) => onChange(clauses.filter((_, idx) => idx !== i))
  const update = (i: number, val: string) => { const c = [...clauses]; c[i] = val; onChange(c) }

  return (
    <div className="space-y-2">
      {clauses.map((c, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="text-xs font-black text-slate-400 mt-3 shrink-0 w-5">{i + 1}.</span>
          <textarea
            value={c}
            onChange={e => update(i, e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button onClick={() => remove(i)} className="p-1.5 mt-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors">
        <Plus className="w-3.5 h-3.5" /> Add Clause
      </button>
    </div>
  )
}

export default function DraftResolutionModule({ role, sessionState, setSessionState, committeeId }: DraftResolutionModuleProps) {
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    sponsors: '',
    signatories: '',
    preamblatory: [''],
    operative: ['']
  })

  const drafts = sessionState?.drafts || {}
  const draftList = Object.values(drafts) as any[]

  const handleSubmit = () => {
    if (!form.title.trim() || !setSessionState) return
    const id = Date.now().toString()
    const newDraft = {
      id,
      title: form.title,
      sponsors: form.sponsors.split(',').map((s: string) => s.trim()).filter(Boolean),
      signatories: form.signatories.split(',').map((s: string) => s.trim()).filter(Boolean),
      preamblatory: form.preamblatory.filter(Boolean),
      operative: form.operative.filter(Boolean),
      status: 'submitted',
      submittedAt: Date.now(),
      submittedBy: role === 'eb' ? 'Executive Board' : 'Delegate'
    }
    setSessionState({ drafts: { ...drafts, [id]: newDraft } })
    setForm({ title: '', sponsors: '', signatories: '', preamblatory: [''], operative: [''] })
    setShowForm(false)
  }

  const handleApprove = (id: string) => {
    if (!setSessionState) return
    setSessionState({ drafts: { ...drafts, [id]: { ...drafts[id], status: 'approved' } } })
  }

  const handleReject = (id: string) => {
    if (!setSessionState) return
    setSessionState({ drafts: { ...drafts, [id]: { ...drafts[id], status: 'rejected' } } })
  }

  const statusColors: Record<string, string> = {
    submitted: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-600 border-red-200',
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Folder className="w-5 h-5 text-indigo-600" />
            <h2 className="text-2xl font-bold text-slate-900">Oasis Briefcase</h2>
          </div>
          <p className="text-sm text-slate-500">Submit working papers and draft resolutions.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> New Draft
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {draftList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <FileText className="w-12 h-12 text-slate-200" />
            <p className="font-semibold">No drafts submitted yet</p>
            <p className="text-sm text-slate-300">Submit a working paper or draft resolution.</p>
          </div>
        ) : (
          [...draftList].reverse().map((draft: any) => (
            <div key={draft.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setExpanded(expanded === draft.id ? null : draft.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-bold text-slate-800">{draft.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sponsors: {draft.sponsors?.join(', ') || 'None'} · {new Date(draft.submittedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusColors[draft.status] || statusColors.submitted}`}>
                    {draft.status}
                  </span>
                  {expanded === draft.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              <AnimatePresence>
                {expanded === draft.id && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                      {draft.sponsors?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sponsors</p>
                          <div className="flex flex-wrap gap-1.5">
                            {draft.sponsors.map((s: string) => (
                              <span key={s} className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {draft.signatories?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Signatories</p>
                          <div className="flex flex-wrap gap-1.5">
                            {draft.signatories.map((s: string) => (
                              <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {draft.preamblatory?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preambulatory Clauses</p>
                          <ol className="space-y-1.5">
                            {draft.preamblatory.map((c: string, i: number) => (
                              <li key={i} className="flex gap-2 text-sm text-slate-700">
                                <span className="text-slate-400 font-mono shrink-0">{i + 1}.</span>
                                <span className="italic">{c}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {draft.operative?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Operative Clauses</p>
                          <ol className="space-y-1.5">
                            {draft.operative.map((c: string, i: number) => (
                              <li key={i} className="flex gap-2 text-sm text-slate-700">
                                <span className="text-slate-400 font-mono shrink-0">{i + 1}.</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {role === 'eb' && draft.status === 'submitted' && (
                        <div className="flex gap-3 pt-2 border-t border-slate-100">
                          <button onClick={() => handleApprove(draft.id)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button onClick={() => handleReject(draft.id)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* New Draft Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-lg">New Working Paper / Draft Resolution</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Title / Code</label>
                  <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Working Paper 1.1 on Climate Action"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Sponsors (comma-separated)</label>
                    <input value={form.sponsors} onChange={e => setForm(f => ({...f, sponsors: e.target.value}))} placeholder="France, Germany, India"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Signatories (comma-separated)</label>
                    <input value={form.signatories} onChange={e => setForm(f => ({...f, signatories: e.target.value}))} placeholder="USA, UK, Japan"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Preambulatory Clauses</label>
                  <ClauseEditor clauses={form.preamblatory} onChange={c => setForm(f => ({...f, preamblatory: c}))} placeholder="e.g. Recognizing the importance of..." />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Operative Clauses</label>
                  <ClauseEditor clauses={form.operative} onChange={c => setForm(f => ({...f, operative: c}))} placeholder="e.g. Calls upon member states to..." />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50">Cancel</button>
                <button onClick={handleSubmit} disabled={!form.title.trim()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-40 shadow-sm">
                  Submit to Chairs
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

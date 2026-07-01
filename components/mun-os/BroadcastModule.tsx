'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, Plus, X, Zap, MessageSquare, PenTool, FileText, Globe } from 'lucide-react'
import { firebaseDb as database } from '@/lib/firebase-client'
import { ref, push, set } from 'firebase/database'

interface BroadcastModuleProps {
  role: 'eb' | 'delegate'
  committeeId?: string | null
  sessionState: any
  setSessionState?: (s: any) => void
}

const ARTICLE_TYPES = [
  { id: 'breaking', label: 'Breaking News', icon: Zap, color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'news', label: 'News Report', icon: Newspaper, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'opinion', label: 'Opinion Piece', icon: PenTool, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'bulletin', label: 'Committee Bulletin', icon: FileText, color: 'bg-teal-100 text-teal-700 border-teal-200' },
]

export default function BroadcastModule({ role, committeeId, sessionState, setSessionState }: BroadcastModuleProps) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'news', headline: '', body: '', author: '', beat: '' })

  const broadcasts = sessionState?.broadcasts || {}
  const articles = Object.values(broadcasts) as any[]

  const handlePublish = () => {
    if (!form.headline.trim() || !form.body.trim() || !setSessionState) return
    const id = Date.now().toString()
    const article = {
      id,
      ...form,
      publishedAt: Date.now()
    }
    setSessionState({ broadcasts: { ...broadcasts, [id]: article } })
    setForm({ type: 'news', headline: '', body: '', author: '', beat: '' })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    if (!setSessionState || role !== 'eb') return
    const newBroadcasts = { ...broadcasts }
    delete newBroadcasts[id]
    setSessionState({ broadcasts: newBroadcasts })
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} · ${d.toLocaleDateString()}`
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Oasis Broadcast</h2>
            <p className="text-sm text-slate-500 mt-0.5">Publish articles and bulletins from the press floor.</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Write Article
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Newspaper className="w-12 h-12 text-slate-200" />
            <p className="font-semibold">No articles published yet</p>
            <p className="text-sm text-slate-300">Be the first to publish from the press floor.</p>
          </div>
        ) : (
          [...articles].sort((a: any, b: any) => b.publishedAt - a.publishedAt).map((article: any) => {
            const typeConfig = ARTICLE_TYPES.find(t => t.id === article.type) || ARTICLE_TYPES[1]
            const Icon = typeConfig.icon
            return (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="px-6 pt-5 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${typeConfig.color}`}>
                          <Icon className="w-3 h-3" />
                          {typeConfig.label}
                        </span>
                        {article.beat && (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{article.beat}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">{article.headline}</h3>
                    </div>
                    {role === 'eb' && (
                      <button onClick={() => handleDelete(article.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg shrink-0 mt-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-6 pb-5">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{article.body}</p>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
                    {article.author && <span>By <span className="font-bold text-slate-600">{article.author}</span></span>}
                    <span>{formatTime(article.publishedAt)}</span>
                  </div>
                </div>
              </motion.article>
            )
          })
        )}
      </div>

      {/* Publish Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-lg">Write & Publish</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto p-6 space-y-4">
                {/* Article Type */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Article Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ARTICLE_TYPES.map(t => (
                      <button key={t.id} onClick={() => setForm(f => ({...f, type: t.id}))}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-left text-sm font-semibold transition-all ${
                          form.type === t.id ? `${t.color} border-current` : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Headline *</label>
                  <input value={form.headline} onChange={e => setForm(f => ({...f, headline: e.target.value}))} placeholder="Write a compelling headline..."
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Article Body *</label>
                  <textarea value={form.body} onChange={e => setForm(f => ({...f, body: e.target.value}))} rows={6} placeholder="Write your article..."
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Author</label>
                    <input value={form.author} onChange={e => setForm(f => ({...f, author: e.target.value}))} placeholder="Reporter name"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Beat / Committee</label>
                    <input value={form.beat} onChange={e => setForm(f => ({...f, beat: e.target.value}))} placeholder="e.g. UNSC"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50">Cancel</button>
                <button onClick={handlePublish} disabled={!form.headline.trim() || !form.body.trim()}
                  className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 disabled:opacity-40 shadow-sm">
                  Publish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

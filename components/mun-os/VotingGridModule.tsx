'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Vote, Check, X, Minus, BarChart3, Play, StopCircle } from 'lucide-react'
import type { SessionDelegate } from '@/app/eb-portal/session/page'
import { getCountryCode } from '@/utils/countryCodes'
import * as Flags from 'country-flag-icons/react/3x2'

function CountryFlag({ countryCode, country }: { countryCode?: string, country?: string }) {
  const code = countryCode || getCountryCode(country || '')
  const FlagComponent = (Flags as any)[code]
  if (!FlagComponent) return (
    <div className="w-9 h-6 rounded bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">{code}</div>
  )
  return (
    <div className="w-9 h-6 rounded overflow-hidden shadow border border-slate-200/60 shrink-0">
      <FlagComponent title={country} className="w-full h-full object-cover" />
    </div>
  )
}

interface VotingGridModuleProps {
  role: 'eb' | 'delegate'
  delegates: SessionDelegate[]
  sessionState: any
  setSessionState?: (s: any) => void
}

export default function VotingGridModule({ role, delegates, sessionState, setSessionState }: VotingGridModuleProps) {
  const [resTitle, setResTitle] = useState('')

  const voting = sessionState?.voting || { isOpen: false, resolutionTitle: '', votes: {} }
  const votes: Record<string, string> = voting.votes || {}

  const yesVotes = Object.values(votes).filter(v => v === 'yes').length
  const noVotes = Object.values(votes).filter(v => v === 'no').length
  const abstainVotes = Object.values(votes).filter(v => v === 'abstain').length
  const totalVoted = yesVotes + noVotes + abstainVotes
  const totalDelegates = delegates.length
  // P+V delegates cannot abstain - only use delegates who are present
  const rollCall = sessionState?.rollCall || {}
  const presentDelegates = delegates.filter(d => rollCall[d.id] === 'P' || rollCall[d.id] === 'P+V')
  const pvDelegates = delegates.filter(d => rollCall[d.id] === 'P+V')
  const passed = yesVotes > noVotes && yesVotes > 0

  const handleOpenVoting = () => {
    if (!setSessionState || !resTitle.trim()) return
    setSessionState({ voting: { isOpen: true, resolutionTitle: resTitle.trim(), votes: {} } })
  }

  const handleCloseVoting = () => {
    if (!setSessionState) return
    setSessionState({ voting: { ...voting, isOpen: false } })
  }

  const handleVote = (delegateId: string, vote: 'yes' | 'no' | 'abstain') => {
    if (!setSessionState || !voting.isOpen) return
    const newVotes = { ...votes, [delegateId]: vote }
    setSessionState({ voting: { ...voting, votes: newVotes } })
  }

  const handleReset = () => {
    if (!setSessionState) return
    setSessionState({ voting: { isOpen: false, resolutionTitle: '', votes: {} } })
    setResTitle('')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
      <div className="px-8 py-5 border-b border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900">Voting Grid</h2>
        <p className="text-sm text-slate-500 mt-0.5">Formal voting procedure on draft resolutions.</p>
      </div>

      {/* Control Panel (EB only) */}
      {role === 'eb' && (
        <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100">
          {!voting.isOpen ? (
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={resTitle}
                onChange={e => setResTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOpenVoting()}
                placeholder="Resolution / Draft title..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleOpenVoting}
                disabled={!resTitle.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-40 shadow-sm transition-all"
              >
                <Play className="w-4 h-4 fill-white" /> Open Voting
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse" />
                <p className="font-bold text-slate-800">Voting Open: <span className="text-indigo-600">{voting.resolutionTitle}</span></p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCloseVoting} className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors">
                  <StopCircle className="w-4 h-4" /> Close
                </button>
                <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Bar */}
      {totalVoted > 0 && (
        <div className="px-8 py-4 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-bold text-slate-700">Yes: <span className="text-emerald-600">{yesVotes}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-sm font-bold text-slate-700">No: <span className="text-red-600">{noVotes}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400"></span>
              <span className="text-sm font-bold text-slate-700">Abstain: <span className="text-slate-500">{abstainVotes}</span></span>
            </div>
            <div className="ml-auto">
              {!voting.isOpen && totalVoted > 0 && (
                <span className={`text-sm font-black px-4 py-1.5 rounded-full ${passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {passed ? '✓ Resolution Passed' : '✗ Resolution Failed'}
                </span>
              )}
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
            <motion.div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${(yesVotes / Math.max(1, totalDelegates)) * 100}%` }} />
            <motion.div className="h-full bg-red-500" style={{ width: `${(noVotes / Math.max(1, totalDelegates)) * 100}%` }} />
            <motion.div className="h-full bg-slate-400 rounded-r-full" style={{ width: `${(abstainVotes / Math.max(1, totalDelegates)) * 100}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{totalVoted} of {presentDelegates.length} present delegates have voted</p>
        </div>
      )}

      {/* Voting Slots */}
      <div className="flex-1 overflow-y-auto">
        {!voting.isOpen && totalVoted === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Vote className="w-12 h-12 text-slate-200" />
            <p className="font-semibold">No active voting</p>
            {role === 'eb' && <p className="text-sm">Enter a resolution title above to open voting.</p>}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {presentDelegates.map((del, i) => {
              const vote = votes[del.id]
              const isPV = rollCall[del.id] === 'P+V'
              return (
                <div key={del.id} className={`flex items-center gap-4 px-8 py-3.5 transition-colors ${vote ? 'bg-slate-50/30' : ''}`}>
                  <span className="text-xs font-mono text-slate-300 w-5">{(i+1).toString().padStart(2,'0')}</span>
                  <CountryFlag countryCode={del.countryCode} country={del.country} />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{del.country}</p>
                    <p className="text-xs text-slate-400">{isPV ? 'Present & Voting' : 'Present'}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVote(del.id, 'yes')}
                      disabled={!voting.isOpen}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        vote === 'yes' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-40'
                      }`}
                    >
                      <Check className="w-3 h-3" /> Yes
                    </button>
                    <button
                      onClick={() => handleVote(del.id, 'no')}
                      disabled={!voting.isOpen}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        vote === 'no' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50 disabled:opacity-40'
                      }`}
                    >
                      <X className="w-3 h-3" /> No
                    </button>
                    {!isPV && (
                      <button
                        onClick={() => handleVote(del.id, 'abstain')}
                        disabled={!voting.isOpen}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          vote === 'abstain' ? 'bg-slate-500 text-white border-slate-500 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-40'
                        }`}
                      >
                        <Minus className="w-3 h-3" /> Abstain
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

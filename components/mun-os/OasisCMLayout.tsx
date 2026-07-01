'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Users, Scale, List, FileText, MessageSquare, Archive,
  ArrowLeft, Gavel, Shield, Mic, Vote, BookOpen, Folder,
  Newspaper, Camera, Edit3, Globe, Flame, Star
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export type CommitteeType = 'un' | 'aippm' | 'ip'

interface OasisCMLayoutProps {
  children: React.ReactNode
  activeModule: string
  setActiveModule: (m: string) => void
  role: 'eb' | 'delegate'
  committeeName?: string
  committeeType?: CommitteeType
}

const UN_MODULES = [
  { id: 'roll_call', label: 'Roll Call', icon: Users, desc: 'Attendance & quorum' },
  { id: 'agenda', label: 'Agenda Setting', icon: BookOpen, desc: 'Set debate topic' },
  { id: 'gsl', label: 'GSL', icon: Mic, desc: 'General Speakers List' },
  { id: 'motions', label: 'Motion Board', icon: Scale, desc: 'Caucus & motions' },
  { id: 'draft', label: 'Briefcase', icon: Folder, desc: 'Working papers & drafts' },
  { id: 'directive', label: 'Directive Desk', icon: FileText, desc: 'Review submissions' },
  { id: 'voting', label: 'Voting Grid', icon: Vote, desc: 'Formal voting procedure' },
  { id: 'document', label: 'Documents', icon: FileText, desc: 'Push resources' },
  { id: 'chat', label: 'Live Chat', icon: MessageSquare, desc: 'Committee messaging' },
  { id: 'archives', label: 'Archives', icon: Archive, desc: 'Session history' },
]

const AIPPM_MODULES = [
  { id: 'roll_call', label: 'Roll Call', icon: Users, desc: 'Party attendance' },
  { id: 'opening', label: 'Opening Statements', icon: Mic, desc: 'Party positions' },
  { id: 'debate', label: 'Debate Floor', icon: Flame, desc: 'Moderated debate' },
  { id: 'points', label: 'Points & Interjections', icon: Star, desc: 'Points of info/order' },
  { id: 'draft', label: 'Policy Drafting', icon: Edit3, desc: 'Communiqué & bills' },
  { id: 'voting', label: 'Voting', icon: Vote, desc: 'Consensus / Voting' },
  { id: 'chat', label: 'Live Chat', icon: MessageSquare, desc: 'Inter-party messaging' },
  { id: 'archives', label: 'Archives', icon: Archive, desc: 'Session history' },
]

const IP_MODULES = [
  { id: 'roll_call', label: 'Beat Allocation', icon: Globe, desc: 'Assign coverage beats' },
  { id: 'coverage', label: 'Live Coverage', icon: Camera, desc: 'Track proceedings' },
  { id: 'interviews', label: 'Interview Desk', icon: Mic, desc: 'Log & request interviews' },
  { id: 'broadcast', label: 'Broadcast', icon: Newspaper, desc: 'Publish articles' },
  { id: 'chat', label: 'Press Lounge', icon: MessageSquare, desc: 'Journalist messaging' },
]

const TYPE_CONFIG = {
  un: { 
    label: 'UN Committee', 
    color: 'from-indigo-500 to-indigo-700', 
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    accent: 'indigo',
    modules: UN_MODULES 
  },
  aippm: { 
    label: 'AIPPM', 
    color: 'from-orange-500 to-orange-700', 
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    accent: 'orange',
    modules: AIPPM_MODULES 
  },
  ip: { 
    label: 'International Press', 
    color: 'from-teal-500 to-teal-700', 
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
    accent: 'teal',
    modules: IP_MODULES 
  }
}

export default function OasisCMLayout({ children, activeModule, setActiveModule, role, committeeName, committeeType = 'un' }: OasisCMLayoutProps) {
  const router = useRouter()
  const config = TYPE_CONFIG[committeeType] || TYPE_CONFIG.un
  const modules = config.modules

  const activeLabel = modules.find(m => m.id === activeModule)?.label || 'Module'

  return (
    <div className="min-h-screen bg-[#F7F8FC] font-sans text-slate-800 flex overflow-hidden">
      
      {/* Left Sidebar */}
      <div className="w-[260px] bg-white border-r border-slate-200/80 flex flex-col h-screen shrink-0 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
        
        {/* Brand Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 font-semibold text-[11px] uppercase tracking-widest mb-4 transition-colors group w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Exit Session
          </button>
          
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-md`}>
              <Gavel className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-none">Oasis CM</h1>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">KIMUN 2026</p>
            </div>
          </div>
        </div>

        {/* Committee Info */}
        <div className="px-4 py-3 space-y-2 border-b border-slate-100">
          {committeeName && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Committee</p>
              <p className="text-sm font-bold text-slate-800 leading-tight">{committeeName}</p>
            </div>
          )}
          <div className="flex gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${config.badge}`}>
              {config.label}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
              role === 'eb' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              <Shield className="w-2.5 h-2.5" />
              {role === 'eb' ? 'EB' : 'Delegate'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-3 mb-2">Modules</p>
          {modules.map((mod) => {
            const isActive = activeModule === mod.id
            const Icon = mod.icon
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group text-left ${
                  isActive 
                    ? `bg-gradient-to-r ${config.color} text-white shadow-md` 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'
                }`}>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold leading-none truncate ${isActive ? 'text-white' : ''}`}>{mod.label}</p>
                  <p className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{mod.desc}</p>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-300 font-medium">Oasis · Committee Management</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 py-3 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{activeLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500">Live Session</span>
          </div>
        </div>

        {/* Module Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Scale, 
  List, 
  FileText, 
  MessageSquare, 
  Archive,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MunOSLayoutProps {
  children: React.ReactNode
  activeModule: string
  setActiveModule: (m: string) => void
  role: 'eb' | 'delegate'
  committeeName?: string
}

const MODULES = [
  { id: 'roll_call', label: 'ROLL CALL', icon: Users },
  { id: 'motions', label: 'MOTIONS & VOTING', icon: Scale },
  { id: 'speakers', label: 'SPEAKERS LIST', icon: List },
  { id: 'document', label: 'DOCUMENT UPLOAD', icon: FileText },
  { id: 'chat', label: 'LIVE CHAT', icon: MessageSquare },
  { id: 'archives', label: 'ARCHIVES', icon: Archive },
]

export default function MunOSLayout({ children, activeModule, setActiveModule, role, committeeName }: MunOSLayoutProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F5EEDB] font-sans selection:bg-[#1A3626] selection:text-white flex overflow-hidden">
      
      {/* Left Sidebar */}
      <div className="w-[380px] p-12 flex flex-col h-screen overflow-y-auto hide-scrollbar shrink-0 relative z-10">
        
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#1A3626]/60 hover:text-[#1A3626] font-bold text-xs uppercase tracking-widest mb-12 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Session
        </button>

        <div className="mb-12">
          <h1 className="text-5xl font-black text-[#1A3626] leading-[1.1] tracking-tight uppercase">
            Everything<br />Chairs<br />Need<br />
            <span className="text-[#C19A6B]">To Run<br />Committees</span>
          </h1>
          <p className="mt-6 text-sm text-[#1A3626]/70 leading-relaxed font-medium">
            One dashboard. Every tool. From opening session to final voting. 
            {committeeName && <span className="block mt-2 font-bold text-[#1A3626]">{committeeName}</span>}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {MODULES.map((mod) => {
            const isActive = activeModule === mod.id
            const Icon = mod.icon
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`flex items-center gap-4 px-6 py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#1A3626] text-[#F5EEDB] shadow-[0_8px_30px_rgb(26,54,38,0.2)] translate-x-2' 
                    : 'bg-[#1A3626]/90 text-white/90 hover:bg-[#1A3626] hover:translate-x-1'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#C19A6B]' : 'text-white/50'}`} />
                {mod.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-12 relative flex items-center justify-center">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-[#E8DFCA]/40 blur-[120px]" />
        </div>

        <motion.div 
          key={activeModule}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-10 w-full max-w-5xl"
        >
          {children}
        </motion.div>
      </div>

    </div>
  )
}

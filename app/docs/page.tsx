'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Book, Zap, Shield, Globe, Terminal, Code2, 
  Database, Layout, ArrowRight, ChevronRight,
  Gavel, Users, Menu, X
} from 'lucide-react'

const SIDEBAR_NAV = [
  {
    title: 'Getting Started',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'architecture', label: 'Core Architecture' },
      { id: 'quickstart', label: 'Quickstart Guide' }
    ]
  },
  {
    title: 'Core Modules',
    items: [
      { id: 'smart-form', label: 'Oasis Smart Form' },
      { id: 'command-centre', label: 'Command Centre' },
      { id: 'moderation', label: 'In-Session Moderation' },
      { id: 'crisis', label: 'Crisis Suite' }
    ]
  },
  {
    title: 'Technical Docs',
    items: [
      { id: 'firebase', label: 'Firebase Real-time Sync' },
      { id: 'security', label: 'Role-based Security' },
      { id: 'api', label: 'API Reference' }
    ]
  }
]

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('introduction')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case 'introduction':
        return (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                <Book className="w-3.5 h-3.5" /> Platform Documentation
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Introduction to Oasis</h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                Oasis is the ultimate Operating System for large-scale Model United Nations conferences. 
                Built to eliminate operational silos, it provides a seamless real-time grid of modules from 
                delegate registration to final academic evaluation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-indigo-500/50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 text-indigo-400">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">Real-time Sync</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Powered by Firebase, actions in the moderation panel instantly reflect across all delegate devices without refreshing.</p>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-violet-500/50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4 text-violet-400">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">Granular Security</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Strict role-based access control ensuring EB, Delegates, and OC only see modules relevant to their clearance level.</p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-800">
              <h2 className="text-2xl font-bold text-white mb-4">Design Philosophy</h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Most conferences rely on disconnected tools: WhatsApp for communication, Google Sheets for tracking, and paper for voting. 
                Oasis unifies these into a single, cohesive interface. Our design prioritizes:
              </p>
              <ul className="space-y-3">
                {[
                  'Zero latency between executive actions and delegate views',
                  'Dark-mode native, premium interface for academic focus',
                  'Frictionless onboarding with no training required'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )

      case 'architecture':
        return (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Core Architecture</h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                The Oasis ecosystem is structured across 5 core operational layers, tightly coupled through a unified data fabric.
              </p>
            </div>

            <div className="space-y-6 mt-8">
              {[
                { name: 'A. Participant Lifecycle', desc: 'Handles everything from initial registration (Smart Form) through to live Check-in and portfolio assignment.', icon: Users, color: 'indigo' },
                { name: 'B. In-Session Moderation', desc: 'The digital committee room. Contains Roll Call, Speaker Lists, Motion Boards, and Voting Grids.', icon: Gavel, color: 'violet' },
                { name: 'C. Crisis Simulation Suite', desc: 'Real-time narrative generation engine and directive submission desk for active crisis committees.', icon: Zap, color: 'rose' },
                { name: 'D. Backstage Operations', desc: 'The Command Centre. Tracks logistics, inventory, and cross-committee broadcast communications.', icon: Globe, color: 'amber' },
                { name: 'E. Evaluation & Analytics', desc: 'Academic scoring systems, dynamic algorithms, and automated award generation.', icon: Database, color: 'emerald' },
              ].map((layer, i) => (
                <div key={i} className="flex gap-6 p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className={`w-12 h-12 shrink-0 rounded-xl bg-${layer.color}-500/10 flex items-center justify-center text-${layer.color}-400`}>
                    <layer.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{layer.name}</h3>
                    <p className="text-slate-400 leading-relaxed">{layer.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
        
      case 'firebase':
        return (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Firebase Real-time Sync</h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                Oasis relies heavily on Firebase Realtime Database for sub-10ms synchronization across the conference floor.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-8">
              <h3 className="text-xl font-bold text-white mb-4">State Schema Example</h3>
              <div className="bg-slate-950 rounded-xl p-4 overflow-x-auto border border-slate-800">
                <pre className="text-sm text-emerald-400 font-mono">
{`{
  "committeeSessions": {
    "sc-01": {
      "activeSpeaker": "United States",
      "speakerTimeLeft": 45,
      "currentMotion": {
        "type": "Moderated Caucus",
        "topic": "Cyber Warfare",
        "status": "voting"
      }
    }
  }
}`}
                </pre>
              </div>
              <p className="text-slate-400 text-sm mt-4">
                When the Executive Board updates the active speaker, Firebase triggers a push event to all delegate dashboards in the committee, highlighting the active speaker instantly.
              </p>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Terminal className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Documentation Coming Soon</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              We are actively writing the documentation for the "{SIDEBAR_NAV.flatMap(g => g.items).find(i => i.id === activeTab)?.label}" section. Check back shortly!
            </p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/oasis-platform" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-950/50 group-hover:scale-105 transition-transform">
                <Gavel className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">Oasis Docs</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/oasis-platform" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              Platform Home
            </Link>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto flex">
        {/* Sidebar */}
        <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 shrink-0 border-r border-slate-800 min-h-[calc(100vh-64px)] p-6 bg-slate-950/50 md:sticky md:top-16 md:self-start md:overflow-y-auto`} >
          <nav className="space-y-8">
            {SIDEBAR_NAV.map((group, i) => (
              <div key={i}>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  {group.title}
                </h4>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setActiveTab(item.id)
                          setMobileMenuOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === item.id 
                            ? 'bg-indigo-500/10 text-indigo-400' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-6 md:p-12 lg:p-16">
          <div className="max-w-3xl">
            {renderContent()}
            
            {/* Pagination block */}
            <div className="mt-16 pt-8 border-t border-slate-800 flex justify-between">
              <button className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                ← Previous Section
              </button>
              <button className="text-indigo-400 hover:text-indigo-300 text-sm font-bold transition-colors flex items-center gap-1">
                Next Section <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

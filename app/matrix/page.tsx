'use client'
import React, { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get } from 'firebase/database'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Globe, Users, CheckCircle2, XCircle, Loader2, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Firebase configuration...
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

type Committee = {
  id: string
  name: string
  emoji: string
  portfolios: Portfolio[]
}

type Portfolio = {
  id: string
  country: string
  countryCode: string
  isDoubleDelAllowed: boolean
  isVacant: boolean
  minExperience: number
}

export default function MatrixPage() {
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCommittee, setSelectedCommittee] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [doubleDelFilter, setDoubleDelFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchCommittees = async () => {
      try {
        const committeesRef = ref(db, 'committees')
        const snapshot = await get(committeesRef)
        
        if (snapshot.exists()) {
          const committeesData = snapshot.val()
          const committeesArray = Object.keys(committeesData).map(key => ({
            id: key,
            ...committeesData[key],
            portfolios: Object.keys(committeesData[key].portfolios || {}).map(portfolioKey => ({
              id: portfolioKey,
              ...committeesData[key].portfolios[portfolioKey]
            }))
          }))
          setCommittees(committeesArray)
        }
        setLoading(false)
      } catch (err) {
        setError('Failed to load live committee records')
        setLoading(false)
      }
    }

    fetchCommittees()
  }, [])

  // Filtering Logic
  const filteredCommittees = committees.filter(committee => {
    if (selectedCommittee !== 'all' && committee.id !== selectedCommittee) return false
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const committeeMatches = committee.name.toLowerCase().includes(term)
      const portfolioMatches = committee.portfolios.some(p => p.country.toLowerCase().includes(term))
      return committeeMatches || portfolioMatches
    }
    return true
  })

  const filteredPortfolios = filteredCommittees.flatMap(committee => 
    committee.portfolios
      .filter(portfolio => {
        if (statusFilter !== 'all') {
          const desiredStatus = statusFilter === 'vacant'
          if (portfolio.isVacant !== desiredStatus) return false
        }
        
        if (doubleDelFilter !== 'all') {
          const desiredDoubleDel = doubleDelFilter === 'yes'
          if (portfolio.isDoubleDelAllowed !== desiredDoubleDel) return false
        }
        return true
      })
      .map(portfolio => ({
        ...portfolio,
        committeeName: committee.name,
        committeeId: committee.id
      }))
  )

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
      <div className="text-center p-8">
        <div className="animate-spin flex justify-center mb-4">
          <Loader2 className="h-8 w-8 text-indigo-600" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Matrix Ledger...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <XCircle className="w-10 h-10 text-red-500 mb-3" />
      <h2 className="text-xl font-bold mb-1">System Error</h2>
      <p className="text-sm text-slate-500 max-w-md mb-4">{error}</p>
      <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6">
        Try Again
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900 antialiased selection:bg-indigo-100">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-7xl">
          <Link href="/" className="inline-flex items-center gap-2 group text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="text-xs tracking-widest uppercase text-slate-400 font-bold">
            KIMUN 2026 • Matrix Portal
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-28 pb-16 max-w-7xl">
        <div className="mb-12 space-y-2">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Live Inventory</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Globe className="text-indigo-600 h-6 w-6 shrink-0" /> Allocation Matrix
          </h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Review live vacancy data, double delegation parameters, and seat statuses updated in real-time.
          </p>
        </div>

        {/* Search and Filters Controller */}
        <div className="mb-8 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search specific councils or portfolios..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 placeholder:text-slate-400 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className={`border-slate-200 text-sm font-semibold px-4 h-[42px] ${showFilters ? 'bg-slate-100 text-indigo-600' : 'bg-white text-slate-700'}`}
            >
              <Filter className="h-4 w-4 mr-1.5" />
              {showFilters ? 'Hide Filters' : 'Filter Ledger'}
            </Button>
          </div>

          {showFilters && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-inner">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Committee Block</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-medium text-slate-700 focus:outline-none" value={selectedCommittee} onChange={(e) => setSelectedCommittee(e.target.value)}>
                  <option value="all">All Active Committees</option>
                  {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Availability Status</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-medium text-slate-700 focus:outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Portfolios</option>
                  <option value="vacant">Available Only</option>
                  <option value="allocated">Allocated Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Double Delegation</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-medium text-slate-700 focus:outline-none" value={doubleDelFilter} onChange={(e) => setDoubleDelFilter(e.target.value)}>
                  <option value="all">All Setup Types</option>
                  <option value="yes">Double Delegation Allowed</option>
                  <option value="no">Single Seats Only</option>
                </select>
              </div>
            </motion.div>
          )}
        </div>

        {/* Committee Overview Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredCommittees.map(committee => {
            const vacantCount = committee.portfolios.filter(p => p.isVacant).length
            return (
              <div key={committee.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5 space-y-4">
                <h3 className="text-base font-bold text-slate-900 leading-snug truncate">{committee.name}</h3>
                
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Slots</span>
                    <span className="text-lg font-black text-slate-800">{committee.portfolios.length}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Vacant</span>
                    <span className="text-lg font-black text-indigo-600">{vacantCount}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Users className="h-3 w-3" /> Quick View Portfolios
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {committee.portfolios.slice(0, 4).map(p => (
                      <div key={p.id} className={`px-2 py-1.5 rounded-md text-xs font-semibold truncate flex items-center gap-1.5 ${p.isVacant ? 'bg-green-50 text-green-700 border border-green-100/60' : 'bg-slate-50 text-slate-400 line-through'}`}>
                        <span className="text-[9px] font-bold">{p.isVacant ? '●' : '✕'}</span> {p.country}
                      </div>
                    ))}
                    {committee.portfolios.length > 4 && (
                      <div className="px-2 py-1.5 rounded-md text-xs font-medium bg-slate-50 text-slate-400 text-center border border-dashed border-slate-200">
                        +{committee.portfolios.length - 4} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detailed Sheet Table Data */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Granular Status Inventory</h2>
            <div className="text-xs text-slate-400 font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-sm">
              Displaying {filteredPortfolios.length} filtered items
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Assigned Council</th>
                    <th className="px-6 py-3.5">Portfolio Allocation</th>
                    <th className="px-6 py-3.5">Availability Status</th>
                    <th className="px-6 py-3.5">Double Delegation Configuration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {filteredPortfolios.length > 0 ? (
                    filteredPortfolios.map(portfolio => (
                      <tr key={`${portfolio.committeeId}-${portfolio.id}`} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 text-slate-900 font-semibold">{portfolio.committeeName}</td>
                        <td className="px-6 py-3.5 text-slate-600">{portfolio.country}</td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${portfolio.isVacant ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-slate-100 border border-slate-200 text-slate-400'}`}>
                            {portfolio.isVacant ? 'Available' : 'Allocated'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          {portfolio.isDoubleDelAllowed ? (
                            <span className="text-green-600 flex items-center gap-1 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Allowed</span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1 text-xs font-medium">Single Seat Only</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-xs font-semibold text-slate-400">
                        No portfolio entries correspond with your selected filter queries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Corporate Light Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20 py-8 text-center text-xs text-slate-400 font-semibold">
        <p>© 2026 Kalinga International MUN Secretariat. All rights reserved.</p>
      </footer>
    </div>
  )
}
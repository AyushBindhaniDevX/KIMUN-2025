'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Award, IndianRupee, CheckCircle2, Clock, XCircle, ChevronLeft, Loader2 } from 'lucide-react'
import { ref, get } from 'firebase/database'
import { firebaseDb } from '@/lib/firebase-client'
import Link from 'next/link'

export default function PrizeTracking() {
  const [trackingId, setTrackingId] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [trackingData, setTrackingData] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingId.trim()) return

    setStatus('loading')
    setErrorMessage('')
    setTrackingData(null)

    try {
      const cleanId = trackingId.trim().toUpperCase()
      const trackRef = ref(firebaseDb, `prize_tracking/${cleanId}`)
      const snap = await get(trackRef)

      if (snap.exists()) {
        setTrackingData(snap.val())
        setStatus('success')
      } else {
        setErrorMessage('Invalid Tracking ID or no record found.')
        setStatus('error')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while tracking.')
      setStatus('error')
    }
  }

  const getStatusIcon = (statusStr: string) => {
    switch (statusStr.toLowerCase()) {
      case 'completed': return <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
      case 'failed': return <XCircle className="w-12 h-12 text-rose-500 mb-4" />
      default: return <Clock className="w-12 h-12 text-amber-500 mb-4 animate-pulse" />
    }
  }

  const getStatusColor = (statusStr: string) => {
    switch (statusStr.toLowerCase()) {
      case 'completed': return 'text-emerald-700 bg-emerald-100'
      case 'failed': return 'text-rose-700 bg-rose-100'
      default: return 'text-amber-700 bg-amber-100'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="border-b bg-white p-4 flex items-center shadow-sm">
        <Link href="/" className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-bold text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Track Your Prize</h1>
            <p className="text-slate-500 text-sm">Enter your unique tracking ID provided by the KIMUN Secretariat to check the status of your cash prize payout.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100">
            <form onSubmit={handleSearch} className="mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Tracking ID</label>
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  placeholder="KIMUN-PRZ-XXXXXX" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-800 font-mono font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Track Status'}
              </button>
            </form>

            <AnimatePresence mode="wait">
              {status === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-50 text-rose-600 border border-rose-100 rounded-xl p-4 text-sm font-semibold text-center overflow-hidden"
                >
                  {errorMessage}
                </motion.div>
              )}

              {status === 'success' && trackingData && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-slate-50 rounded-xl p-6 border border-slate-100 mt-6 flex flex-col items-center relative overflow-hidden"
                >
                  {/* Decorative blobs */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />

                  {getStatusIcon(trackingData.status || '')}
                  <h3 className="text-xl font-bold text-slate-800 mb-1">
                    {trackingData.status === 'Completed' ? 'Payment Successful' : trackingData.status === 'Failed' ? 'Payment Failed' : 'Payment Processing'}
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">Last updated: {new Date(trackingData.createdAt).toLocaleString()}</p>

                  <div className="w-full space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative z-10">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <span className="text-xs font-semibold text-slate-500">Beneficiary</span>
                      <span className="text-sm font-bold text-slate-800">{trackingData.beneficiary}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <span className="text-xs font-semibold text-slate-500">Award</span>
                      <span className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> {trackingData.award}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">Amount</span>
                      <span className="text-lg font-black text-emerald-600 flex items-center">
                        <IndianRupee className="w-4 h-4 mr-0.5" /> 
                        {trackingData.amount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {trackingData.transactionRef && (
                    <div className="mt-4 w-full bg-slate-100/50 p-3 rounded-lg text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Transaction Ref / Remarks</span>
                      <span className="text-xs font-mono text-slate-600 font-semibold">{trackingData.transactionRef}</span>
                    </div>
                  )}

                  <div className="mt-6">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${getStatusColor(trackingData.status || '')}`}>
                      {trackingData.status}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      <footer className="py-6 text-center text-slate-400 text-xs border-t bg-white">
        &copy; {new Date().getFullYear()} KIMUN Secretariat. All rights reserved.
      </footer>
    </div>
  )
}

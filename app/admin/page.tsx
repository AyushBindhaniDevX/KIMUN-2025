'use client'

import React, { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function AdminRedirect() {
  useEffect(() => {
    window.location.href = '/oasis'
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-850 font-sans">
      <Loader2 className="w-7 h-7 text-indigo-600 animate-spin mb-3" />
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Redirecting to Oasis Hub...</span>
    </div>
  )
}
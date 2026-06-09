// app/not-found.tsx
'use client'

import Link from 'next/link'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md shadow-sm">
        <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-6 text-indigo-600">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Page Not Found</h1>
        <p className="text-xs text-slate-500 mb-8 leading-relaxed">
          The requested URL could not be found on our server. If you believe this is an error, please verify the link or return back to the main lobby.
        </p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5 px-6 rounded-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}

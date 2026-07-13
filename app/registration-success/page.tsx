'use client'
import React, { useEffect, useState, useRef, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database'
import html2canvas from 'html2canvas'
import { CheckCircle, Download, Loader2, AlertCircle, ChevronRight, Instagram, Lock, User, Sparkles, MessageCircle } from 'lucide-react'
import * as Flags from 'country-flag-icons/react/3x2'
import Image from 'next/image'
import Link from 'next/link'
import { firebaseDb as db } from '@/lib/firebase-client'

function RegistrationSuccessContent() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const registrationId = searchParams.get('registrationId')
  
  const [registration, setRegistration] = useState<any>(null)
  const [committee, setCommittee] = useState<any>(null)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [zone, setZone] = useState(0)
  const idCardRef = useRef(null)
  const [isOnlineCommittee, setIsOnlineCommittee] = useState(false)

  useEffect(() => {
    if (!paymentId) {
      setError('Missing payment ID')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        let fullRegistration: any = null

        if (registrationId) {
          const registrationRef = ref(db, `registrations/${registrationId}`)
          const snapshot = await get(registrationRef)
          if (!snapshot.exists()) throw new Error('Registration not found')
          
          const registrationData = snapshot.val()
          if (registrationData.paymentId !== paymentId) {
            throw new Error('Payment ID mismatch')
          }
          fullRegistration = { id: registrationId, ...registrationData }
        } else {
          const registrationsRef = query(
            ref(db, 'registrations'),
            orderByChild('paymentId'),
            equalTo(paymentId)
          )

          const snapshot = await get(registrationsRef)
          if (!snapshot.exists()) throw new Error('Registration not found')

          const registrations = snapshot.val()
          const [registrationKey, registrationData] = Object.entries(registrations)[0] as [string, any]
          fullRegistration = { id: registrationKey, ...registrationData }
        }
        const committeeSnapshot = await get(ref(db, `committees/${fullRegistration.committeeId}`))
        const committeeData = committeeSnapshot.val()

        const portfolioData = committeeData.portfolios[fullRegistration.portfolioId]

        setRegistration(fullRegistration)
        setCommittee({
          name: committeeData.name,
          emoji: committeeData.emoji,
          isOnline: committeeData.isOnline || false
        })
        setPortfolio({
          country: portfolioData.country,
          countryCode: portfolioData.countryCode
        })
        setIsOnlineCommittee(committeeData.isOnline || false)
        setZone(Math.floor(Math.random() * 5) + 1)
        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'Failed to load registration')
        setLoading(false)
      }
    }

    fetchData()
  }, [paymentId, registrationId])

  const downloadIDCard = async () => {
    if (!idCardRef.current) return
    try {
      const canvas = await html2canvas(idCardRef.current, { 
        useCORS: true, 
        scale: 3,
        backgroundColor: '#ffffff'
      } as any)
      const link = document.createElement('a')
      link.download = `KIMUN-ID-${registration?.delegateInfo.delegate1.name.split(' ')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err: any) {
      setError('Failed to generate ID card. Please try again.')
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorDisplay message={error} paymentId={paymentId} />
  if (!registration) return <NoData />

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900 selection:bg-indigo-100">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 group text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-indigo-600 transition-colors">
            <Image 
              src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" 
              alt="KIMUN Logo" 
              width={24} 
              height={24} 
              className="mr-1" 
            />
            Kalinga International MUN
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Registration Complete!</h1>
            <p className="text-slate-500 mt-2">
              Thank you for registering for KIMUN 2026. Your application has been confirmed.
            </p>
            
            <div className="mt-4 flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-3 rounded-lg text-sm text-left">
              <MessageCircle className="w-5 h-5 flex-shrink-0" />
              <p>We've sent a confirmation message with your Registration ID to your registered WhatsApp number.</p>
            </div>
          </div>
          
          <div className="space-y-8">
            <div 
              ref={idCardRef}
              className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-xl p-8 relative overflow-hidden text-white shadow-lg"
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <Image 
                  src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" 
                  alt="KIMUN Watermark" 
                  width={300} 
                  height={300} 
                />
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">KIMUN 2026</h2>
                    <p className="text-indigo-200 text-sm">Delegate Digital ID</p>
                    {isOnlineCommittee && (
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-white/20 text-white px-2 py-0.5 rounded-full mt-2 inline-block">
                        Online Committee
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-indigo-200 uppercase tracking-wider mb-1">Registration ID</p>
                    <p className="font-mono text-white font-bold bg-white/10 px-2 py-1 rounded">{registration.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                
                <div className={`grid ${isOnlineCommittee ? 'grid-cols-2' : 'grid-cols-3'} gap-4 mb-6`}>
                  <InfoBox title="Delegate Name" value={
                    registration.isDoubleDel && registration.delegateInfo.delegate2
                      ? `${registration.delegateInfo.delegate1.name} & ${registration.delegateInfo.delegate2.name}`
                      : registration.delegateInfo.delegate1.name
                  } />
                  <InfoBox title="Committee" value={
                    <span className="flex items-center gap-2">
                      {committee.emoji} {committee.name}
                    </span>
                  } />
                  <InfoBox title="Portfolio" value={
                    <span className="flex items-center gap-2">
                      {(() => {
                          const FlagIcon = (Flags as any)[portfolio.countryCode]
                          return FlagIcon ? <FlagIcon className="w-5 h-5 rounded-sm" /> : null
                        })()}
                        {portfolio.country}
                    </span>
                  } />
                  
                </div>
                
              </div>
            </div>

            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <button
                onClick={downloadIDCard}
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 rounded-lg font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                Save ID Card
              </button>
              <button
                onClick={() => window.location.href = `/delegate`}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-lg font-semibold transition-colors"
              >
                <User className="w-4 h-4" />
                Open Delegate Portal
              </button>
            </div>
            
          </div>
        </motion.div>
      </div>
    </div>
  )
}

const InfoBox = ({ title, value }: any) => (
  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
    <p className="text-[10px] text-indigo-200 uppercase tracking-wider mb-1 font-semibold">{title}</p>
    <div className="text-sm font-bold text-white">{value}</div>
  </div>
)

const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
  </div>
)

const ErrorDisplay = ({ message, paymentId }: any) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
    <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
    <p className="text-slate-500 max-w-md mb-4">{message}</p>
    {paymentId && <p className="text-sm text-slate-400 font-mono">Payment ID: {paymentId}</p>}
    <button 
      onClick={() => window.location.href = '/'}
      className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold"
    >
      Return Home
    </button>
  </div>
)

const NoData = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
    No registration data available
  </div>
)

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RegistrationSuccessContent />
    </Suspense>
  )
}
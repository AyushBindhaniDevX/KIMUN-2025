// app/delegate/page.tsx
'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { ref, get } from 'firebase/database'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  User, FileText, Award, Download, QrCode, ChevronDown, ChevronUp,
  Loader2, Copy, Lock, LogOut, Calendar, MapPin, Clock, Sparkles,
  ExternalLink, CheckCircle, Gift, BookOpen, TrendingUp, Users,
  Mail, Phone, Building, GraduationCap, BarChart3, Globe,
  DollarSign, Info, Ticket, Clock as ClockIcon, Briefcase,
  Shield, Leaf, Gavel, Heart, Car, Flag, Landmark, ArrowLeft,
  AlertCircle, CreditCard, BadgeCheck, CircleDot
} from 'lucide-react'
import { Toaster, toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { firebaseAuth, firebaseDb, googleProvider } from '@/lib/firebase-client'
import * as Flags from 'country-flag-icons/react/3x2'

const db = firebaseDb

type Mark = {
  total: number
  gsl: number
  mod1: number
  mod2: number
  mod3: number
  mod4: number
  lobby: number
  chits: number
  fp: number
  doc: number
  alt: string
  isApproved?: boolean
}

type DelegateData = {
  id: string
  name: string
  email: string
  committeeId: string
  portfolioId: string
  isCheckedIn: boolean
  marks?: Mark
  experience?: number
  institution?: string
  phone?: string
  year?: string
  course?: string
  isDoubleDel?: boolean
  paymentId?: string
  registrationPhase?: string
  averageExperience?: number
  couponCode?: string
  discountApplied?: number
  timestamp?: number
  isBlacklisted?: boolean
  blacklistReason?: string
}

type CommitteeData = {
  name: string
  description: string
  topics: string[]
  backgroundGuide: string
  rules: string
  type: string
  emoji: string
  portfolios: {
    [key: string]: {
      country: string
      countryCode: string
      isDoubleDelAllowed: boolean
      isVacant: boolean
      minExperience: number
    }
  }
}

type ConferenceDetails = {
  eventName: string
  tagline: string
  dates: string
  location: string
  venue: string
  description: string
  committeesCount: number
  expectedDelegates: number
  registrationPhases: Array<{
    name: string
    price: number
    doublePrice: number
    isActive: boolean
  }>
}

type Resource = {
  id: string
  title: string
  description: string
  type: 'guide' | 'rules' | 'template' | 'training'
  url: string
  committee?: string
  pages?: number
  includes?: string[]
  format?: string
  isApproved?: boolean
}

type Coupon = {
  id: string
  title: string
  description: string
  code: string
  partner: string
  logo: string
  expiry: string
  discount: string
  terms: string
}

function DelegateDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [delegate, setDelegate] = useState<DelegateData | null>(null)
  const [coDelegate, setCoDelegate] = useState<any>(null)
  const [committee, setCommittee] = useState<CommitteeData | null>(null)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [conferenceDetails, setConferenceDetails] = useState<ConferenceDetails | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState({
    login: false,
    data: false,
    resources: false,
    coupons: false
  })
  const [expandedCard, setExpandedCard] = useState<string | null>('performance')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user: any) => {
      if (user) {
        setLoggedIn(true)
        setAuthError(null)
        fetchDelegateData(user.email || '', user.uid)
      } else {
        setLoggedIn(false)
        setDelegate(null)
        setCommittee(null)
        setPortfolio(null)
        setConferenceDetails(null)
      }
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const fetchDelegateData = async (email: string, uid: string) => {
    try {
      setLoading(prev => ({ ...prev, data: true }))

      const delegatesRef = ref(db, 'registrations')
      const snapshot = await get(delegatesRef)

      if (!snapshot.exists()) {
        throw new Error('No registrations found in database')
      }

      const allRegistrations = snapshot.val()
      let foundKey: string | null = null
      let foundData: any = null

      for (const key of Object.keys(allRegistrations)) {
        const reg = allRegistrations[key]
        const d1Email = reg?.delegateInfo?.delegate1?.email?.toLowerCase()
        const d2Email = reg?.delegateInfo?.delegate2?.email?.toLowerCase()
        const firebaseUid = reg?.firebaseUid

        if (
          (d1Email && d1Email === email.toLowerCase()) ||
          (d2Email && d2Email === email.toLowerCase()) ||
          (firebaseUid && firebaseUid === uid)
        ) {
          foundKey = key
          foundData = reg
          break
        }
      }

      if (!foundKey || !foundData) {
        throw new Error('No delegate found with this email or user ID')
      }

      const d1Email = foundData?.delegateInfo?.delegate1?.email?.toLowerCase()
      const d2Email = foundData?.delegateInfo?.delegate2?.email?.toLowerCase()
      const delegateKey = (d2Email && d2Email === email.toLowerCase()) ? 'delegate2' : 'delegate1'
      const coDelegateKey = delegateKey === 'delegate1' ? 'delegate2' : 'delegate1'

      const blacklistRef = ref(db, `blacklisted/${foundKey}_${delegateKey}`)
      const blacklistSnap = await get(blacklistRef)
      if (blacklistSnap.exists()) {
        const blData = blacklistSnap.val()
        setDelegate({
          id: foundKey,
          name: foundData.delegateInfo[delegateKey]?.name || '',
          email: foundData.delegateInfo[delegateKey]?.email || '',
          committeeId: foundData.committeeId || '',
          portfolioId: foundData.portfolioId || '',
          isCheckedIn: false,
          isBlacklisted: true,
          blacklistReason: blData.reason
        })
        setLoading(prev => ({ ...prev, data: false }))
        return
      }

      setDelegate({
        id: foundKey,
        ...foundData.delegateInfo[delegateKey],
        committeeId: foundData.committeeId,
        portfolioId: foundData.portfolioId,
        isDoubleDel: foundData.isDoubleDel || false,
        paymentId: foundData.paymentId,
        registrationPhase: foundData.registrationPhase || 'Unknown',
        averageExperience: foundData.averageExperience,
        couponCode: foundData.couponCode,
        discountApplied: foundData.discountApplied,
        timestamp: foundData.timestamp
      })

      if (foundData.isDoubleDel && foundData.delegateInfo[coDelegateKey]) {
        setCoDelegate(foundData.delegateInfo[coDelegateKey])
      } else {
        setCoDelegate(null)
      }

      fetchConferenceDetails()
      fetchCommitteeData(foundData.committeeId, foundData.portfolioId)
      fetchMarksData(foundData.committeeId, foundData.portfolioId)
      fetchResources()
      fetchCoupons()
    } catch (error) {
      console.error('Error fetching delegate data:', error)
      handleLogout()
    } finally {
      setLoading(prev => ({ ...prev, data: false }))
    }
  }

  const fetchConferenceDetails = async () => {
    try {
      const conferenceRef = ref(db, 'conferenceDetails')
      const conferenceSnapshot = await get(conferenceRef)
      if (conferenceSnapshot.exists()) {
        setConferenceDetails(conferenceSnapshot.val())
      }
    } catch (error) {
      console.error('Error fetching conference details:', error)
    }
  }

  const fetchCommitteeData = async (committeeId: string, portfolioId: string) => {
    try {
      const committeeRef = ref(db, `committees/${committeeId}`)
      const committeeSnapshot = await get(committeeRef)

      if (committeeSnapshot.exists()) {
        const committeeData = committeeSnapshot.val()
        setCommittee(committeeData)

        if (committeeData.portfolios && portfolioId) {
          setPortfolio(committeeData.portfolios[portfolioId])
        }
      }
    } catch (error) {
      console.error('Error fetching committee data:', error)
    }
  }

  const fetchMarksData = async (committeeId: string, portfolioId: string) => {
    try {
      const marksRef = ref(db, `marksheets/${committeeId}/marks`)
      const marksSnapshot = await get(marksRef)

      if (marksSnapshot.exists()) {
        const marksData = marksSnapshot.val()
        const delegateMarks = Object.values(marksData).find(
          (mark: any) => mark.portfolioId === portfolioId && mark.isApproved === true
        ) as Mark | undefined

        if (delegateMarks) {
          setDelegate(prev => ({
            ...prev!,
            marks: delegateMarks
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching marks data:', error)
    }
  }

  const fetchResources = async () => {
    try {
      setLoading(prev => ({ ...prev, resources: true }))

      const resourcesRef = ref(db, 'resources')
      const resourcesSnapshot = await get(resourcesRef)

      if (resourcesSnapshot.exists()) {
        const resourcesData = resourcesSnapshot.val()
        const resourcesList = Object.keys(resourcesData).map(key => ({
          id: key,
          ...resourcesData[key]
        })) as Resource[]
        setResources(resourcesList.filter(r =>
          (r.type === 'guide' || r.type === 'rules' || r.type === 'template') &&
          r.isApproved !== false
        ))
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(prev => ({ ...prev, resources: false }))
    }
  }

  const fetchCoupons = async () => {
    try {
      setLoading(prev => ({ ...prev, coupons: true }))

      const couponsRef = ref(db, 'coupons')
      const couponsSnapshot = await get(couponsRef)

      if (couponsSnapshot.exists()) {
        const couponsData = couponsSnapshot.val()
        const couponsList = Object.keys(couponsData).map(key => ({
          id: key,
          ...couponsData[key]
        })) as Coupon[]
        setCoupons(couponsList)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    } finally {
      setLoading(prev => ({ ...prev, coupons: false }))
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(prev => ({ ...prev, login: true }))
    setAuthError(null)
    try {
      await signInWithPopup(firebaseAuth, googleProvider)
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in failed')
      toast.error(err?.message || 'Google sign-in failed')
    } finally {
      setLoading(prev => ({ ...prev, login: false }))
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth)
    } catch (err) {
      console.error('Logout error:', err)
    }
    setLoggedIn(false)
    setDelegate(null)
    setCoDelegate(null)
    setCommittee(null)
    setPortfolio(null)
    setConferenceDetails(null)
    setResources([])
    setCoupons([])
    router.push('/delegate')
    toast.info('Logged out successfully')
  }

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getCommitteeTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'crisis': return 'bg-red-50 text-red-700 border-red-100'
      case 'general': return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'specialized': return 'bg-purple-50 text-purple-700 border-purple-100'
      case 'national': return 'bg-orange-50 text-orange-700 border-orange-100'
      default: return 'bg-slate-50 text-slate-700 border-slate-100'
    }
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-pulse flex justify-center mb-4">
            <Image
              src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png"
              alt="Loading"
              width={56}
              height={56}
              className="opacity-80"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png"
                alt="KIMUN Logo"
                width={64}
                height={64}
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Delegate Portal</h1>
            <p className="text-sm text-slate-500 mt-2">Sign in with your registered Google account</p>
          </div>

          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm"
            >
              {authError}
            </motion.div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-white font-semibold text-base rounded-xl shadow-sm"
            disabled={loading.login}
          >
            {loading.login ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.83 1.37-2.14 2.46-3.72 2.95v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          <p className="text-center text-slate-400 text-xs mt-6">
            Use the Google account associated with your KIMUN registration.
          </p>
        </motion.div>
      </div>
    )
  }

  if (delegate?.isBlacklisted) {
    return (
      <div className="min-h-screen bg-rose-50/40 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-rose-200 p-8 rounded-2xl shadow-sm w-full max-w-md text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-rose-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-600 mb-6">Your delegate account has been suspended from accessing the portal.</p>
          
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-8 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-1">Administrative Reason</p>
            <p className="text-sm text-rose-900 font-medium">{delegate.blacklistReason || 'Violation of conference policies.'}</p>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-slate-200 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900 antialiased">
      <Toaster position="top-right" richColors />

      {/* Navigation - Matching Registration Page */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-6xl">
          <Link href="/" className="inline-flex items-center gap-2 group text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Portal Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-slate-700">{delegate?.name?.split(' ')[0]}</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="h-8 px-3 text-xs border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        {/* Welcome Banner - Matching Registration Card Style */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Verified Delegate</span>
                {delegate?.isCheckedIn && (
                  <span className="text-xs font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Checked In
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Welcome, {delegate?.name?.split(' ')[0]}!</h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>{committee?.name || 'Committee'}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span>{portfolio?.country || delegate?.portfolioId}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delegate ID</p>
                <p className="text-xs font-mono font-medium text-slate-700">{delegate?.id?.substring(0, 8)}...</p>
              </div>
              {delegate?.id && (
                <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${delegate.id}`}
                    alt="Delegate QR Code"
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Committee Card */}
          <motion.div variants={fadeInUp}>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
              <div
                className="px-5 py-4 border-b border-slate-100 flex justify-between items-center cursor-pointer"
                onClick={() => toggleCard('committee')}
              >
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-500" />
                  Committee
                </h2>
                {expandedCard === 'committee' ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <div className="p-5 space-y-4">
                {committee ? (
                  <>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Committee Name</p>
                      <p className="font-semibold text-slate-800 mt-1 flex items-center gap-1">
                        <span className="text-lg">{committee.emoji}</span> {committee.name}
                      </p>
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{committee.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${getCommitteeTypeColor(committee.type)}`}>
                        {committee.type || 'General'} Committee
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Topics</p>
                      <div className="space-y-2">
                        {(committee?.topics || ['TBA'])
                          .filter((t) => t && t !== 'TBA')
                          .map((topic, i) => (
                            <div key={i} className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                              <p className="text-sm text-slate-600">{topic}</p>
                            </div>
                          ))}
                        {(!committee.topics || committee.topics.length === 0 || committee.topics[0] === 'TBA') && (
                          <p className="text-sm text-slate-400 italic">Topics will be announced soon</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">No committee information available</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Portfolio Card */}
          <motion.div variants={fadeInUp}>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Flag className="h-4 w-4 text-indigo-500" />
                  Portfolio
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {portfolio ? (
                  <>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Representing</p>
                      <p className="font-semibold text-slate-800 mt-1 flex items-center gap-2">
                        {(() => {
                          const FlagComponent = (Flags as Record<string, React.ComponentType<{ className?: string }>>)[portfolio.countryCode]
                          return FlagComponent && <FlagComponent className="w-5 h-4 rounded-sm shadow-sm" />
                        })()}
                        {portfolio.country}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                        <p className="text-xs font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${delegate?.isCheckedIn ? 'bg-green-500' : 'bg-amber-500'}`} />
                          {delegate?.isCheckedIn ? 'Checked In' : 'Not Checked In'}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Experience</p>
                        <p className="text-xs font-medium text-slate-700 mt-0.5 capitalize">
                          {portfolio.minExperience === 0 ? 'Beginner' : portfolio.minExperience === 1 ? 'Intermediate' : 'Advanced'}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delegation</p>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">{delegate?.isDoubleDel ? 'Double' : 'Single'}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phase</p>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">{delegate?.registrationPhase}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Payment ID</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-1 break-all bg-slate-50 p-1.5 rounded-md">{delegate?.paymentId}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">No portfolio information available</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Personal Details Card */}
          <motion.div variants={fadeInUp}>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-500" />
                  Personal Details
                </h2>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { icon: User, label: 'Full Name', value: delegate?.name },
                  { icon: Mail, label: 'Email', value: delegate?.email },
                  { icon: Phone, label: 'Phone', value: delegate?.phone || 'Not specified' },
                  { icon: Building, label: 'Institution', value: delegate?.institution || 'Not specified' },
                  { icon: GraduationCap, label: 'Course & Year', value: delegate?.course ? `${delegate.course} (Year ${delegate.year || 'N/A'})` : 'Not specified' },
                  { icon: TrendingUp, label: 'MUN Experience', value: `${delegate?.experience || 0} ${delegate?.experience === 1 ? 'conference' : 'conferences'}` },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-1">
                    <item.icon className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                      <p className="text-sm text-slate-700">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Co-Delegate Card */}
          {delegate?.isDoubleDel && coDelegate && (
            <motion.div variants={fadeInUp}>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-500" />
                    Co-Delegate
                  </h2>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: 'Name', value: coDelegate.name },
                    { label: 'Email', value: coDelegate.email },
                    { label: 'Phone', value: coDelegate.phone || 'Not specified' },
                    { label: 'Institution', value: coDelegate.institution || 'Not specified' },
                    { label: 'Course & Year', value: coDelegate.course ? `${coDelegate.course} (Year ${coDelegate.year})` : 'Not specified' },
                    { label: 'Experience', value: `${coDelegate.experience || 0} conferences` },
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</span>
                      <span className="text-sm text-slate-700 font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Registration Details Card */}
          <motion.div variants={fadeInUp}>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-indigo-500" />
                  Registration Details
                </h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phase</span>
                  <span className="text-xs font-semibold text-slate-700 bg-indigo-50 px-2 py-0.5 rounded-md">{delegate?.registrationPhase || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment ID</span>
                  <span className="text-[11px] font-mono text-slate-500">{delegate?.paymentId || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registered On</span>
                  <span className="text-xs text-slate-600">{formatDate(delegate?.timestamp)}</span>
                </div>
                {delegate?.couponCode && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Coupon</span>
                    <span className="text-xs font-mono text-indigo-600">{delegate.couponCode}</span>
                  </div>
                )}
                {delegate?.discountApplied && delegate.discountApplied > 0 && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Discount</span>
                    <span className="text-xs font-semibold text-green-600">₹{delegate.discountApplied}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Experience</span>
                  <span className="text-xs text-slate-600">{delegate?.averageExperience || 'N/A'} conferences</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Performance Card */}
          <motion.div variants={fadeInUp} className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
              <div
                className="px-5 py-4 border-b border-slate-100 flex justify-between items-center cursor-pointer"
                onClick={() => toggleCard('performance')}
              >
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  Performance Metrics
                </h2>
                {expandedCard === 'performance' ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <div className="p-5">
                {delegate?.marks ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Score</p>
                        <p className="text-3xl font-bold text-indigo-600">{delegate.marks.total}<span className="text-sm text-slate-400 font-normal">/50</span></p>
                      </div>
                      <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <span className="text-xl font-bold text-indigo-600">{Math.round((delegate.marks.total / 50) * 100)}%</span>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedCard === 'performance' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                            {[
                              { label: 'GSL', value: delegate.marks.gsl },
                              { label: 'Mod Caucus 1', value: delegate.marks.mod1 },
                              { label: 'Mod Caucus 2', value: delegate.marks.mod2 },
                              { label: 'Mod Caucus 3', value: delegate.marks.mod3 },
                              { label: 'Mod Caucus 4', value: delegate.marks.mod4 },
                              { label: 'Lobbying', value: delegate.marks.lobby },
                              { label: 'Chits', value: delegate.marks.chits },
                              { label: 'Foreign Policy', value: delegate.marks.fp },
                              { label: 'Resolution', value: delegate.marks.doc },
                              { label: 'Alternative', value: delegate.marks.alt },
                            ].map((item, i) => (
                              <div key={i} className="bg-slate-50 p-2.5 rounded-lg">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                                <p className="text-base font-bold text-slate-700">{item.value}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-4">* Scores are out of 50 total points</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Your marks will appear here after committee sessions</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Conference Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Info className="h-4 w-4 text-indigo-500" />
                Conference Information
              </h2>
            </div>
            <div className="p-6">
              {conferenceDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">About the Conference</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{conferenceDetails.description}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-indigo-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dates</p>
                          <p className="text-sm text-slate-700">{conferenceDetails.dates}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-indigo-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Venue</p>
                          <p className="text-sm text-slate-700">{conferenceDetails.venue}</p>
                          <p className="text-xs text-slate-500">{conferenceDetails.location}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="h-4 w-4 text-indigo-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expected Delegates</p>
                          <p className="text-sm text-slate-700">{conferenceDetails.expectedDelegates}+ participants</p>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
                  <p className="text-sm text-slate-500 mt-2">Loading conference details...</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Partner Offers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Gift className="h-4 w-4 text-indigo-500" />
                Partner Offers
              </h2>
            </div>
            <div className="p-6">
              {loading.coupons ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : coupons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {coupons.map((coupon, idx) => (
                    <motion.div
                      key={coupon.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {coupon.logo && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <Image
                              src={coupon.logo}
                              alt={coupon.partner}
                              width={36}
                              height={36}
                              className="rounded"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">{coupon.partner}</h3>
                          <span className="text-[10px] text-slate-400">Expires: {coupon.expiry}</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {coupon.discount}
                        </span>
                        <p className="text-xs text-slate-600 mt-1">{coupon.description}</p>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg mb-2">
                        {coupon.code?.startsWith('http') ? (
                          <a href={coupon.code} target="_blank" rel="noopener noreferrer">
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 rounded-lg">
                              <ExternalLink className="h-3 w-3 mr-1.5" />
                              Redeem
                            </Button>
                          </a>
                        ) : (
                          <div className="flex items-center justify-between">
                            <code className="font-mono text-xs text-slate-700">{coupon.code}</code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(coupon.code);
                                toast.success('Copied!');
                              }}
                              className="text-indigo-500 hover:text-indigo-700"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400">{coupon.terms}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No partner offers available at this time</p>
                  <p className="text-xs text-slate-400 mt-1">Check back later for exclusive discounts!</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Resources Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mb-8"
        >
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                Resources
              </h2>
            </div>
            <div className="p-6">
              {loading.resources ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : resources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((resource, idx) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FileText className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800">{resource.title}</h3>
                          <p className="text-[10px] text-slate-400 uppercase">{resource.committee || 'General Resource'}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-4">{resource.description}</p>
                      {resource.url && resource.url !== 'ggo' && (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-xs h-8 rounded-lg">
                            <Download className="mr-1.5 h-3 w-3" />
                            Download
                          </Button>
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No resources available for your committee</p>
                  <p className="text-xs text-slate-400 mt-1">Check back later for study guides and rules</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Schedule Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-indigo-500" />
                Conference Schedule
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {[
                  {
                    day: "Day 1",
                    date: conferenceDetails?.dates?.split(' ')[0] || "July 5, 2026",
                    events: [
                      { time: "08:00 - 09:00", title: "Registration & Kit Distribution", location: "Main Lobby" },
                      { time: "09:00 - 10:30", title: "Opening Ceremony", location: "Auditorium" },
                      { time: "10:30 - 11:00", title: "Networking Coffee Break", location: "Foyer" },
                      { time: "11:00 - 13:00", title: "Committee Session I", location: "Committee Rooms" },
                      { time: "13:00 - 14:00", title: "Lunch Break", location: "Dining Hall" },
                      { time: "14:00 - 16:00", title: "Committee Session II", location: "Committee Rooms" },
                      { time: "16:00 - 16:30", title: "Evening Coffee Break", location: "Foyer" },
                      { time: "16:30 - 18:00", title: "Committee Session III", location: "Committee Rooms" },
                    ]
                  },
                  {
                    day: "Day 2",
                    date: conferenceDetails?.dates?.split(' ')[2] || "July 6, 2026",
                    events: [
                      { time: "09:00 - 11:00", title: "Committee Session IV", location: "Committee Rooms" },
                      { time: "11:00 - 11:30", title: "Morning Coffee Break", location: "Foyer" },
                      { time: "11:30 - 13:30", title: "Committee Session V", location: "Committee Rooms" },
                      { time: "13:30 - 14:30", title: "Lunch Break", location: "Dining Hall" },
                      { time: "14:30 - 16:30", title: "Final Committee Session VI", location: "Committee Rooms" },
                      { time: "16:30 - 17:00", title: "Refreshment Break", location: "Foyer" },
                      { time: "17:00 - 18:30", title: "Closing Ceremony & Awards", location: "Auditorium" }
                    ]
                  }
                ].map((daySchedule, dayIndex) => (
                  <div key={dayIndex} className="relative pl-5 border-l-2 border-indigo-200">
                    <div className="absolute -left-[9px] top-0 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-800">{daySchedule.day}</h3>
                      <p className="text-xs text-slate-500">{daySchedule.date}</p>
                    </div>
                    <div className="space-y-2.5">
                      {daySchedule.events.map((event, eventIndex) => (
                        <div key={eventIndex} className="flex items-start gap-4 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="min-w-[95px]">
                            <p className="text-xs font-semibold text-indigo-600">{event.time}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">{event.title}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" /> {event.location}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="mt-12 pt-6 border-t border-slate-200 text-center"
        >
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} {conferenceDetails?.eventName || 'KIMUN'}. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            For assistance, contact the Organizing Committee at{' '}
            <a href="mailto:info@kimun.com" className="text-indigo-500 hover:underline">info@kimun.com</a>
          </p>
        </motion.footer>
      </main>
    </div>
  )
}

export default function DelegateDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    }>
      <DelegateDashboardContent />
    </Suspense>
  )
}
'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Confetti from 'react-confetti'
import { Sparkles, CheckCircle, Globe, Users, AlertCircle, ChevronRight, Calendar, Clock, Lock, Unlock, ArrowLeft } from 'lucide-react'
import * as Flags from 'country-flag-icons/react/3x2'
import { ref, get, push, update, onValue } from 'firebase/database'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import Image from 'next/image'
import Link from "next/link"
import { firebaseAuth, firebaseDb, googleProvider } from '@/lib/firebase-client'
import { sendWhatsAppTemplate } from '@/lib/fast2sms'
type Committee = {
  id: string
  name: string
  emoji: string
  portfolios: Portfolio[]
  isOnline?: boolean
}

type Portfolio = {
  id: string
  country: string
  countryCode: string
  isDoubleDelAllowed: boolean
  isVacant: boolean
  minExperience: number
}

type DelegateInfo = {
  delegate1: {
    name: string
    email: string
    phone: string
    institution: string
    year: string
    course: string
    experience: string
  }
  delegate2?: {
    name: string
    email: string
    phone: string
    institution: string
    year: string
    course: string
    experience: string
  }
}

type BlacklistEntry = {
  email: string
  phone: string
  name: string
  reason: string
}

type LegacyDelegateProfile = {
  full_name: string
  email: string | null
  phone: string | null
  institution: string | null
  year: number
  number_of_mun_attended: number | null
  joint_delegate_name: string | null
  joint_delegate_email: string | null
  joint_delegate_phone: string | null
}

type AuthUser = {
  uid: string
  email: string | null
  displayName: string | null
}

const BLACKLIST: BlacklistEntry[] = [
  {
    email: "deku.shreayansh@gmail.com",
    phone: "8280883762",
    name: "Shreayansh Agrawal",
    reason: "BLACKLISTED FROM PARTNER CONFERENCE"
  },
  {
    email: "deku.shreayansh@gmail.com",
    phone: "+918280883762",
    name: "Shreayansh Agrawal",
    reason: "BLACKLISTED FROM PARTNER CONFERENCE"
  },
  {
    email: "test.user@example.com",
    phone: "5555555555",
    name: "Test User",
    reason: "Fraudulent registration attempt"
  }
]

const REGISTRATION_PHASES = [
  {
    name: "Early Bird",
    startDate: new Date('2026-04-15'),
    endDate: new Date('2026-05-10'),
    singlePrice: 1299,
    doublePrice: 2499,
    isActive: true
  },
  {
    name: "Phase 1",
    startDate: new Date('2026-05-11'),
    endDate: new Date('2026-05-31'),
    singlePrice: 1399,
    doublePrice: 2699,
    isActive: false
  },
  {
    name: "Final Phase",
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-25'),
    singlePrice: 1500,
    doublePrice: 2899,
    isActive: false
  }
]

const VALID_COUPONS = {
  "BGUDELEGATION": 100,
  "RAVENSHAWDELEGATION": 100,
  "SOADELEGATION": 100,
  "KIMUN2026WELCOME": 1500,
}

export default function RegistrationPage() {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [legacyProfile, setLegacyProfile] = useState<LegacyDelegateProfile | null>(null)
  const [legacyProfileLoading, setLegacyProfileLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [delegateInfo, setDelegateInfo] = useState<DelegateInfo>({
    delegate1: {
      name: '',
      email: '',
      phone: '',
      institution: '',
      year: '',
      course: '',
      experience: ''
    }
  })
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [isDoubleDel, setIsDoubleDel] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<typeof REGISTRATION_PHASES[0] | null>(null)
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [siteSettings, setSiteSettings] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user: any) => {
      const normalizedUser = user
        ? {
          uid: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? null,
        }
        : null

      setAuthUser(normalizedUser)
      setAuthLoading(false)

      if (!normalizedUser) {
        setLegacyProfile(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!authUser?.email) return

    const prefillWithLegacyData = async () => {
      try {
        setLegacyProfileLoading(true)
        const response = await fetch(`/api/delegate-profile?email=${encodeURIComponent(authUser.email || '')}`)
        if (!response.ok) return

        const data = await response.json()
        const profile = data?.profile as LegacyDelegateProfile | null
        if (!profile) return

        setLegacyProfile(profile)
        setDelegateInfo((prev) => ({
          ...prev,
          delegate1: {
            ...prev.delegate1,
            name: prev.delegate1.name || profile.full_name || authUser.displayName || '',
            email: prev.delegate1.email || profile.email || authUser.email || '',
            phone: prev.delegate1.phone || profile.phone || '',
            institution: prev.delegate1.institution || profile.institution || '',
            year: prev.delegate1.year || (profile.year ? String(profile.year) : ''),
            experience: prev.delegate1.experience || String(profile.number_of_mun_attended ?? ''),
          },
          delegate2:
            prev.delegate2 || profile.joint_delegate_email || profile.joint_delegate_name || profile.joint_delegate_phone
              ? {
                name: prev.delegate2?.name || profile.joint_delegate_name || '',
                email: prev.delegate2?.email || profile.joint_delegate_email || '',
                phone: prev.delegate2?.phone || profile.joint_delegate_phone || '',
                institution: prev.delegate2?.institution || '',
                year: prev.delegate2?.year || '',
                course: prev.delegate2?.course || '',
                experience: prev.delegate2?.experience || '',
              }
              : prev.delegate2,
        }))
      } catch (profileError) {
        console.error('Failed to fetch legacy profile', profileError)
      } finally {
        setLegacyProfileLoading(false)
      }
    }

    setDelegateInfo((prev) => ({
      ...prev,
      delegate1: {
        ...prev.delegate1,
        name: prev.delegate1.name || authUser.displayName || '',
        email: prev.delegate1.email || authUser.email || '',
      },
    }))

    prefillWithLegacyData()
  }, [authUser])

  const handleGoogleSignIn = async () => {
    try {
      setAuthError('')
      await signInWithPopup(firebaseAuth, googleProvider)
    } catch (signinError: any) {
      setAuthError(signinError?.message || 'Google sign-in failed')
    }
  }

  const handleGoogleSignOut = async () => {
    try {
      await signOut(firebaseAuth)
    } catch (signoutError) {
      console.error('Failed to sign out', signoutError)
    }
  }

  useEffect(() => {
    const settingsRef = ref(firebaseDb, 'site_settings')
    const unsub = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        setSiteSettings(snap.val())
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const checkRegistrationPhase = () => {
      let mode = siteSettings?.registrationMode || 'Auto'
      
      if (mode === 'Closed') {
        setCurrentPhase(null)
        setRegistrationOpen(false)
        return
      }

      if (mode !== 'Auto') {
        const manualPhase = REGISTRATION_PHASES.find(p => p.name === mode)
        if (manualPhase) {
          setCurrentPhase(manualPhase)
          setRegistrationOpen(true)
          return
        }
      }

      const now = new Date()
      let activePhase = null

      for (const phase of REGISTRATION_PHASES) {
        const startDate = new Date(phase.startDate)
        const endDate = new Date(phase.endDate)
        endDate.setHours(23, 59, 59, 999)

        if (now >= startDate && now <= endDate) {
          activePhase = phase
          break
        }
      }

      setCurrentPhase(activePhase)
      setRegistrationOpen(!!activePhase)
    }

    checkRegistrationPhase()
    const interval = setInterval(checkRegistrationPhase, 3600000)
    return () => clearInterval(interval)
  }, [siteSettings])

  useEffect(() => {
    const fetchCommittees = async () => {
      try {
        const committeesRef = ref(firebaseDb, 'committees')
        const snapshot = await get(committeesRef)

        if (snapshot.exists()) {
          const committeesData = snapshot.val()
          const committeesArray: Committee[] = Object.keys(committeesData).map(key => {
            const committee = {
              id: key,
              ...committeesData[key],
              portfolios: Object.keys(committeesData[key].portfolios || {}).map(portfolioKey => ({
                id: portfolioKey,
                ...committeesData[key].portfolios[portfolioKey]
              }))
            }

            if (committee.name === 'Mock War Cabinet' ||
              committee.name === 'United Nations Office on Drugs and Crime') {
              return {
                ...committee,
                isOnline: true,
                portfolios: committee.portfolios.map((p: Portfolio) => ({
                  ...p,
                  isDoubleDelAllowed: false
                }))
              }
            }
            return committee
          })
          setCommittees(committeesArray)
        }
        setLoading(false)
      } catch (err) {
        setError('Failed to load committees')
        setLoading(false)
      }
    }

    fetchCommittees()
  }, [])

  const handleInputChange = (delegate: 'delegate1' | 'delegate2', field: string, value: string) => {
    setDelegateInfo(prev => ({
      ...prev,
      [delegate]: {
        ...prev[delegate],
        [field]: value
      }
    }))
  }

  const validateStep = () => {
    const baseValidation = (
      delegateInfo.delegate1.name.trim() !== '' &&
      delegateInfo.delegate1.email.trim() !== '' &&
      delegateInfo.delegate1.phone.trim() !== '' &&
      delegateInfo.delegate1.institution.trim() !== '' &&
      delegateInfo.delegate1.year.trim() !== '' &&
      delegateInfo.delegate1.course.trim() !== '' &&
      delegateInfo.delegate1.experience.trim() !== ''
    )

    let doubleDelValidation = true
    if (isDoubleDel) {
      doubleDelValidation = (
        delegateInfo.delegate2?.name.trim() !== '' &&
        delegateInfo.delegate2?.email.trim() !== '' &&
        delegateInfo.delegate2?.phone.trim() !== '' &&
        delegateInfo.delegate2?.institution.trim() !== '' &&
        delegateInfo.delegate2?.year.trim() !== '' &&
        delegateInfo.delegate2?.course.trim() !== '' &&
        delegateInfo.delegate2?.experience.trim() !== ''
      )
    }

    const checkBlacklist = (delegate: 'delegate1' | 'delegate2') => {
      const info = delegateInfo[delegate]
      if (!info) return false

      const blacklisted = BLACKLIST.find(entry =>
        entry.email.toLowerCase() === info.email.toLowerCase() ||
        entry.phone === info.phone ||
        entry.name.toLowerCase().replace(/\s+/g, '') === info.name.toLowerCase().replace(/\s+/g, '')
      )

      if (blacklisted) {
        setError(`Registration blocked: ${blacklisted.reason}`)
        return true
      }
      return false
    }

    if (checkBlacklist('delegate1') || (isDoubleDel && delegateInfo.delegate2 && checkBlacklist('delegate2'))) {
      return false
    }

    return baseValidation && doubleDelValidation
  }

  const applyCoupon = () => {
    if (couponCode.trim() === '') {
      setCouponError('Please enter a coupon code')
      return
    }

    const upperCaseCoupon = couponCode.toUpperCase()
    if (VALID_COUPONS.hasOwnProperty(upperCaseCoupon)) {
      setDiscount(VALID_COUPONS[upperCaseCoupon as keyof typeof VALID_COUPONS])
      setCouponApplied(true)
      setCouponError('')
    } else {
      setCouponError('Invalid coupon code')
      setDiscount(0)
      setCouponApplied(false)
    }
  }

  const calculatePrice = () => {
    if (!currentPhase) return 0
    if (selectedCommittee?.isOnline) {
      return 490 - discount
    }
    return (isDoubleDel ? currentPhase.doublePrice : currentPhase.singlePrice) - discount
  }

  const getAverageExperience = () => {
    const exp1 = parseInt(delegateInfo.delegate1.experience) || 0
    if (!isDoubleDel || !delegateInfo.delegate2) return exp1
    const exp2 = parseInt(delegateInfo.delegate2.experience) || 0
    return Math.round((exp1 + exp2) / 2)
  }

  const saveRegistration = async (paymentId: string) => {
    if (!selectedCommittee || !selectedPortfolio) {
      throw new Error('Committee or portfolio not selected')
    }

    try {
      const registrationRef = ref(firebaseDb, 'registrations')

      // Sanitize delegateInfo to prevent Firebase undefined errors
      const sanitizedDelegateInfo: any = {
        delegate1: {
          name: delegateInfo.delegate1.name || '',
          email: delegateInfo.delegate1.email || '',
          phone: delegateInfo.delegate1.phone || '',
          institution: delegateInfo.delegate1.institution || '',
          year: delegateInfo.delegate1.year || '',
          course: delegateInfo.delegate1.course || '',
          experience: delegateInfo.delegate1.experience || '',
        }
      }

      if (isDoubleDel && delegateInfo.delegate2) {
        sanitizedDelegateInfo.delegate2 = {
          name: delegateInfo.delegate2.name || '',
          email: delegateInfo.delegate2.email || '',
          phone: delegateInfo.delegate2.phone || '',
          institution: delegateInfo.delegate2.institution || '',
          year: delegateInfo.delegate2.year || '',
          course: delegateInfo.delegate2.course || '',
          experience: delegateInfo.delegate2.experience || '',
        }
      }

      const newRegistration = await push(registrationRef, {
        delegateInfo: sanitizedDelegateInfo,
        firebaseUid: authUser?.uid || null,
        committeeId: selectedCommittee.id,
        portfolioId: selectedPortfolio.id,
        paymentId,
        timestamp: Date.now(),
        isDoubleDel,
        averageExperience: getAverageExperience(),
        registrationPhase: currentPhase?.name || 'Unknown',
        isOnlineCommittee: selectedCommittee.isOnline || false,
        couponCode: couponApplied ? couponCode : null,
        discountApplied: couponApplied ? discount : 0
      })

      const portfolioRef = ref(firebaseDb, `committees/${selectedCommittee.id}/portfolios/${selectedPortfolio.id}`)
      await update(portfolioRef, { isVacant: false })

      const emailData = {
        email: delegateInfo.delegate1.email,
        name: delegateInfo.delegate1.name,
        registrationId: newRegistration?.key,
        committee: selectedCommittee?.name,
        portfolio: selectedPortfolio?.country,
        amount: calculatePrice(),
        phase: currentPhase?.name || 'Unknown',
        isOnline: selectedCommittee.isOnline || false,
        couponCode: couponApplied ? couponCode : null,
        discount: couponApplied ? discount : 0
      };

      await fetch('/api/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      }).catch(err => console.error('Email sending failed:', err))

      const getFlagEmoji = (countryCode: string) => {
        if (!countryCode) return '👍';
        const codePoints = countryCode
          .toUpperCase()
          .split('')
          .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
      };

      const flagOrThumb = selectedPortfolio?.countryCode ? getFlagEmoji(selectedPortfolio.countryCode) : '👍';
      const committeeString = `${selectedPortfolio?.country || 'Unknown'} (${selectedCommittee?.name || 'Unknown'}) ${flagOrThumb}`;

      const waVariables = [
        delegateInfo.delegate1.name,
        newRegistration?.key || 'PENDING',
        committeeString
      ];

      const confirmationImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${newRegistration?.key || 'PENDING'}`;
      
      if (delegateInfo.delegate1.phone) {
        sendWhatsAppTemplate(25468, delegateInfo.delegate1.phone, waVariables, confirmationImageUrl).catch(console.error);
      }

      return newRegistration.key
    } catch (err) {
      console.error('Registration failed:', err)
      throw new Error('Failed to save registration')
    }
  }

  const initiatePayment = async () => {
    if (isSubmitting) return
    if (!currentPhase) {
      setError('Registration is currently closed')
      return
    }

    if (!validateStep()) return

    setIsSubmitting(true)
    const totalPrice = calculatePrice()

    // If total is 0 or less, skip Razorpay and register directly
    if (totalPrice <= 0) {
      try {
        const registrationKey = await saveRegistration('FREE_REGISTRATION')
        router.push(`/registration-success?paymentId=FREE_REGISTRATION&registrationId=${registrationKey}`)
      } catch (err) {
        setError('Failed to complete registration. Please contact support.')
        setIsSubmitting(false)
      }
      return
    }

    const amount = totalPrice * 100

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true

    script.onload = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: 'INR',
        name: 'KIMUN Registration',
        description: `${isDoubleDel ? 'Double Delegation' : 'Single Delegation'} (${currentPhase.name})`,
        image: 'https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png',
        handler: async (response: any) => {
          try {
            const registrationKey = await saveRegistration(response.razorpay_payment_id)
            router.push(`/registration-success?paymentId=${response.razorpay_payment_id}&registrationId=${registrationKey}`)
          } catch (err) {
            setError('Failed to complete registration. Please contact support.')
            setIsSubmitting(false)
          }
        },
        prefill: {
          name: delegateInfo.delegate1.name,
          email: delegateInfo.delegate1.email,
          contact: delegateInfo.delegate1.phone
        },
        theme: { color: '#4f46e5' },
        modal: { 
          ondismiss: () => {
            setError('Payment cancelled')
            setIsSubmitting(false)
          } 
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    }

    document.body.appendChild(script)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
      <div className="text-center p-8">
        <div className="animate-pulse flex justify-center mb-4">
          <Image src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Loading" width={64} height={64} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loading Configuration System...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
      <h2 className="text-xl font-bold text-slate-900 mb-1">Registration Error</h2>
      <p className="text-sm text-slate-500 max-w-md mb-4">{error}</p>
      <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6">
        Try Again
      </Button>
    </div>
  )

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <div className="text-center p-8">
          <div className="animate-pulse flex justify-center mb-4">
            <Image src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Loading" width={64} height={64} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Checking Google session...</p>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in to Continue</h1>
          <p className="text-sm text-slate-500 mb-6">
            Registration is linked to your Google account for secure access and profile autofill.
          </p>
          <Button onClick={handleGoogleSignIn} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
            Continue with Google
          </Button>
          {authError && <p className="text-sm text-red-500 mt-4">{authError}</p>}
        </div>
      </div>
    )
  }

  if (!registrationOpen) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-10 h-10 text-slate-400 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Registration Closed</h1>
        <p className="text-sm text-slate-500 max-w-md mb-8">Registration is not active at this time. Please see our upcoming application timeline details below.</p>

        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 text-left">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Registration Phases</h2>
          {REGISTRATION_PHASES.map((phase, index) => (
            <div key={index} className="p-3.5 border border-slate-100 bg-slate-50/50 rounded-lg flex items-center justify-between text-sm">
              <div>
                <h4 className="font-semibold text-slate-800">{phase.name}</h4>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(phase.startDate)} - {formatDate(phase.endDate)}</span>
                </div>
              </div>
              <span className="font-bold text-indigo-600">₹{phase.singlePrice}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Clock className="w-4 h-4" /> Confirmed Event Schedule: July 2026
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-slate-50/40 text-slate-900 antialiased selection:bg-indigo-100"
      onCopy={(e) => e.preventDefault()}
    >
      {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 group text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Portal Home
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md">{currentPhase?.name}</span>
            <span className="text-slate-400">Step {step} of 5</span>
            <Button onClick={handleGoogleSignOut} variant="outline" className="h-8 px-3 text-xs border-slate-200">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Core Body */}
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8">
          {(legacyProfileLoading || legacyProfile) && (
            <div className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 text-xs text-indigo-700">
              {legacyProfileLoading
                ? 'Checking legacy delegate profile...'
                : 'Legacy profile found. Available details were auto-filled from previous records.'}
            </div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Step 1</span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Delegation Type</h1>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-4 p-5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="radio" name="delegation" checked={!isDoubleDel} onChange={() => setIsDoubleDel(false)} className="h-4 w-4 text-indigo-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Single Delegation</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Individual seat allocation workflow.</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${selectedCommittee?.isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input type="radio" name="delegation" checked={isDoubleDel} onChange={() => setIsDoubleDel(true)} disabled={selectedCommittee?.isOnline} className="h-4 w-4 text-indigo-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Double Delegation</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Two delegates sharing a single council desk assignment.</p>
                  </div>
                </label>
              </div>

              <Button onClick={() => setStep(2)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5 rounded-lg text-sm inline-flex items-center justify-center gap-1.5">
                Next Step: Contact Details <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Step 2</span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Delegate Information</h1>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Primary Applicant</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['name', 'email', 'phone', 'institution', 'year', 'course'].map((field) => (
                      <div key={field} className="border border-slate-200 rounded-lg p-3 bg-white">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{field}</label>
                        <input className="w-full bg-transparent text-sm text-slate-800 focus:outline-none" value={delegateInfo.delegate1[field as keyof typeof delegateInfo.delegate1]} onChange={(e) => handleInputChange('delegate1', field, e.target.value)} required />
                      </div>
                    ))}
                    <div className="border border-slate-200 rounded-lg p-3 bg-white sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Prior MUNs Attended</label>
                      <input type="number" min="0" className="w-full bg-transparent text-sm text-slate-800 focus:outline-none" value={delegateInfo.delegate1.experience} onChange={(e) => handleInputChange('delegate1', 'experience', e.target.value)} required />
                    </div>
                  </div>
                </div>

                {isDoubleDel && !selectedCommittee?.isOnline && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Secondary Applicant</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['name', 'email', 'phone', 'institution', 'year', 'course'].map((field) => (
                        <div key={field} className="border border-slate-200 rounded-lg p-3 bg-white">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{field}</label>
                          <input className="w-full bg-transparent text-sm text-slate-800 focus:outline-none" value={delegateInfo.delegate2?.[field as keyof typeof delegateInfo.delegate1] || ''} onChange={(e) => handleInputChange('delegate2', field, e.target.value)} required={isDoubleDel} />
                        </div>
                      ))}
                      <div className="border border-slate-200 rounded-lg p-3 bg-white sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Prior MUNs Attended</label>
                        <input type="number" min="0" className="w-full bg-transparent text-sm text-slate-800 focus:outline-none" value={delegateInfo.delegate2?.experience || ''} onChange={(e) => handleInputChange('delegate2', 'experience', e.target.value)} required={isDoubleDel} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 border-slate-200 py-5 text-slate-700">Back</Button>
                <Button onClick={() => validateStep() ? setStep(3) : null} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-lg font-semibold text-sm">Next Step</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Step 3</span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Select Committee</h1>
              </div>

              <div className="space-y-2.5">
                {committees.map(committee => (
                  <div key={committee.id} onClick={() => { setSelectedCommittee(committee); if (committee.isOnline) setIsDoubleDel(false); }} className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between bg-white ${selectedCommittee?.id === committee.id ? 'border-indigo-600 bg-indigo-50/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl shrink-0">{committee.emoji}</span>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-tight">{committee.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{committee.portfolios.filter(p => p.isVacant).length} portfolios open</p>
                      </div>
                    </div>
                    {committee.isOnline && <span className="text-[10px] font-bold tracking-wider uppercase bg-sky-50 border border-sky-100 text-sky-700 px-2 py-0.5 rounded-md">Online</span>}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 border-slate-200 py-5 text-slate-700">Back</Button>
                <Button onClick={() => selectedCommittee ? setStep(4) : setError('Please select a committee')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-lg font-semibold text-sm">Next Step</Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Step 4</span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Select Country / Portfolio</h1>
              </div>

              {selectedCommittee?.portfolios.filter(p => p.isVacant && (isDoubleDel ? p.isDoubleDelAllowed : true) && getAverageExperience() >= p.minExperience).length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No matching portfolios vacant</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {selectedCommittee?.portfolios.filter(p => p.isVacant && (isDoubleDel ? p.isDoubleDelAllowed : true) && getAverageExperience() >= p.minExperience).map(portfolio => {
                    const FlagComponent = (Flags as Record<string, React.ComponentType<{ className?: string }>>)[portfolio.countryCode]

                    return (
                      <div key={portfolio.id} onClick={() => setSelectedPortfolio(portfolio)} className={`border p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between text-sm ${selectedPortfolio?.id === portfolio.id ? 'border-indigo-600 bg-indigo-50/10 font-bold' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="flex items-center gap-2.5">
                          {FlagComponent && React.createElement(FlagComponent, { className: 'w-4 h-4 rounded-sm shadow-sm' })}
                          <span className="text-slate-800">{portfolio.country}</span>
                        </div>
                        {selectedPortfolio?.id === portfolio.id && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={() => setStep(3)} variant="outline" className="flex-1 border-slate-200 py-5 text-slate-700">Back</Button>
                <Button onClick={() => selectedPortfolio ? setStep(5) : setError('Please select a portfolio')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-lg font-semibold text-sm">Next Step</Button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Step 5</span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Verification & Confirmation</h1>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4 text-sm">

                {/* Coupon Block */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex gap-2 items-center">
                  <input type="text" placeholder="Coupon Code" className="flex-1 text-xs font-semibold uppercase tracking-wider bg-transparent focus:outline-none" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={couponApplied} />
                  <Button onClick={applyCoupon} disabled={couponApplied} size="sm" className="bg-indigo-600 text-white text-xs h-8">Apply</Button>
                </div>
                {couponError && <p className="text-xs text-red-500 font-medium">{couponError}</p>}

                {/* Dynamic Invoice Info */}
                <div className="flex justify-between items-center pt-2 border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-800 text-base">Total Registration Fee:</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-indigo-600">₹{calculatePrice()}</span>
                    {couponApplied && <p className="text-[10px] text-green-600 font-bold mt-0.5">Discount Verified</p>}
                  </div>
                </div>

                {/* Allocation Review Block */}
                <div className="space-y-2 text-xs font-medium text-slate-600 pt-1">
                  <div className="flex justify-between"><span className="text-slate-400">Primary Delegate:</span><span className="text-slate-800 font-semibold">{delegateInfo.delegate1.name}</span></div>
                  {isDoubleDel && <div className="flex justify-between"><span className="text-slate-400">Secondary Delegate:</span><span className="text-slate-800 font-semibold">{delegateInfo.delegate2?.name}</span></div>}
                  <div className="flex justify-between"><span className="text-slate-400">Assigned Council:</span><span className="text-slate-800 font-semibold text-right max-w-[180px] truncate">{selectedCommittee?.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Assigned Portfolio:</span><span className="text-slate-800 font-semibold">{selectedPortfolio?.country}</span></div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => setStep(4)} variant="outline" className="flex-1 border-slate-200 py-5 text-slate-700" disabled={isSubmitting}>Back</Button>
                <Button onClick={initiatePayment} disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-5 rounded-lg font-semibold text-sm">
                  {isSubmitting ? 'Processing...' : 'Authorize & Pay'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
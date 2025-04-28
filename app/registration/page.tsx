'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Confetti from 'react-confetti'
import { Sparkles, CheckCircle, Globe, Users, Settings, AlertCircle, ChevronRight, Calendar, Clock, Lock, Unlock, Hotel, Bus,X } from 'lucide-react'
import Flags from 'country-flag-icons/react/3x2'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, push, update } from 'firebase/database'
import Image from 'next/image'
import Link from "next/link"

declare global {
  interface Window {
    mappls: any;
  }
}

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

type AdditionalServices = {
  accommodation: {
    day1: boolean
    day2: boolean
  }
  travelBus: {
    day1: boolean
    day2: boolean
    route?: string
  }
}

const REGISTRATION_PHASES = [
  {
    name: "Pre Early Bird",
    startDate: new Date('2025-04-14'),
    endDate: new Date('2025-04-19'),
    singlePrice: 1,
    doublePrice: 2499,
    isActive: true
  },
  {
    name: "Early Bird",
    startDate: new Date('2025-04-20'),
    endDate: new Date('2025-05-10'),
    singlePrice: 1299,
    doublePrice: 2499,
    isActive: false
  },
  {
    name: "Phase 1",
    startDate: new Date('2025-05-15'),
    endDate: new Date('2025-05-29'),
    singlePrice: 1299,
    doublePrice: 2499,
    isActive: false
  },
  {
    name: "Phase 2",
    startDate: new Date('2025-05-30'),
    endDate: new Date('2025-06-14'),
    singlePrice: 1299,
    doublePrice: 2499,
    isActive: false
  },
  {
    name: "Final Phase",
    startDate: new Date('2025-06-15'),
    endDate: new Date('2025-06-30'),
    singlePrice: 1399,
    doublePrice: 2799,
    isActive: false
  }
]

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

const VALID_COUPONS = {
  "BGUDELEGATION": 99,
  "RAVENSHAWDELEGATION": 99,
  "SOADELEGATION": 99
}

const BUS_ROUTES = [
  {
    id: 'KIIT SQUARE',
    name: 'KIIT SQUARE',
    stops: [
    ]
  },
  {
    id: 'JAYDEV VIHAR ',
    name: 'JAYDEV VIHAR',
    stops: [
    ]
  },
  {
    id: 'VANI VIHAR',
    name: 'VANI VIHAR',
    stops: [
    ]
  },
  {
    id: 'FIRE STATION',
    name: 'FIRE STATION',
    stops: [
    ]
  },
  {
    id: 'BARMUNDA',
    name: 'BARMUNDA',
    stops: [
    ]
  }
  
]

export default function RegistrationPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
  const [additionalServices, setAdditionalServices] = useState<AdditionalServices>({
    accommodation: {
      day1: false,
      day2: false
    },
    travelBus: {
      day1: false,
      day2: false,
      route: ''
    }
  })
  const [showMap, setShowMap] = useState(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)


  useEffect(() => {
    const checkRegistrationPhase = () => {
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
  }, [])

  useEffect(() => {
    const fetchCommittees = async () => {
      try {
        const committeesRef = ref(db, 'committees')
        const snapshot = await get(committeesRef)
        
        if (snapshot.exists()) {
          const committeesData = snapshot.val()
          const committeesArray = Object.keys(committeesData).map(key => {
            const committee = {
              id: key,
              ...committeesData[key],
              portfolios: Object.keys(committeesData[key].portfolios || {}).map(portfolioKey => ({
                id: portfolioKey,
                ...committeesData[key].portfolios[portfolioKey]
              }))
            }
            
            if (committee.name === 'United Nations Security Council' || 
                committee.name === 'United Nations Office on Drugs and Crime') {
              return {
                ...committee,
                isOnline: true,
                portfolios: committee.portfolios.map(p => ({
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

  const handleServiceChange = (service: 'accommodation' | 'travelBus', day: 'day1' | 'day2', value: boolean) => {
    setAdditionalServices(prev => ({
      ...prev,
      [service]: {
        ...prev[service],
        [day]: value
      }
    }))
  }

  const handleRouteChange = (route: string | null) => {
    setAdditionalServices(prev => ({
      ...prev,
      travelBus: {
        ...prev.travelBus,
        route: route || ''
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

    if (isDoubleDel) {
      return baseValidation && 
        delegateInfo.delegate2?.name.trim() !== '' &&
        delegateInfo.delegate2?.email.trim() !== '' &&
        delegateInfo.delegate2?.phone.trim() !== '' &&
        delegateInfo.delegate2?.institution.trim() !== '' &&
        delegateInfo.delegate2?.year.trim() !== '' &&
        delegateInfo.delegate2?.course.trim() !== '' &&
        delegateInfo.delegate2?.experience.trim() !== ''
    }
    return baseValidation
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
  
    let basePrice = 0
    if (selectedCommittee?.isOnline) {
      basePrice = 199
    } else {
      basePrice = isDoubleDel ? currentPhase.doublePrice : currentPhase.singlePrice
    }
  
    if (additionalServices.accommodation.day1) basePrice += 200
    if (additionalServices.accommodation.day2) basePrice += 200
  
    if (additionalServices.travelBus.day1) basePrice += 100
    if (additionalServices.travelBus.day2) basePrice += 100
  
    // ✅ ADD ₹200 if a travel route is selected
    if (additionalServices.travelBus.route) basePrice += 200
  
    const subtotal = basePrice - discount
    const tax = subtotal * 0.03
    return Math.round(subtotal + tax)
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
      const registrationRef = ref(db, 'registrations')
      const newRegistration = await push(registrationRef, {
        delegateInfo,
        committeeId: selectedCommittee.id,
        portfolioId: selectedPortfolio.id,
        paymentId,
        timestamp: Date.now(),
        isDoubleDel,
        averageExperience: getAverageExperience(),
        registrationPhase: currentPhase?.name || 'Unknown',
        isOnlineCommittee: selectedCommittee.isOnline || false,
        couponCode: couponApplied ? couponCode : null,
        discountApplied: couponApplied ? discount : 0,
        additionalServices
      })

      const portfolioRef = ref(db, `committees/${selectedCommittee.id}/portfolios/${selectedPortfolio.id}`)
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
        discount: couponApplied ? discount : 0,
        additionalServices
      };

      await fetch('/api/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      })
      
      return newRegistration.key
    } catch (err) {
      console.error('Registration failed:', err)
      throw new Error('Failed to save registration')
    }
  }

  const initiatePayment = async () => {
    if (!currentPhase) {
      setError('Registration is currently closed')
      return
    }

    const amount = calculatePrice() * 100
    if (!validateStep()) {
      setError('Please fill all required fields')
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true

    script.onload = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: 'INR',
        name: 'KIMUN Registration',
        description: `Registration Fee for ${isDoubleDel ? 'Double Delegation' : 'Single Delegation'} (${currentPhase.name})`,
        image: 'https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png',
        handler: async (response: any) => {
          try {
            const registrationKey = await saveRegistration(response.razorpay_payment_id)
            router.push(`/registration-success?paymentId=${response.razorpay_payment_id}&registrationId=${registrationKey}`)
          } catch (err) {
            console.error('Registration error:', err)
            setError('Failed to complete registration. Please contact support.')
          }
        },
        prefill: {
          name: delegateInfo.delegate1.name,
          email: delegateInfo.delegate1.email,
          contact: delegateInfo.delegate1.phone
        },
        theme: { color: '#d97706' },
        modal: { ondismiss: () => setError('Payment cancelled') }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()

      rzp.on('payment.failed', (response: any) => {
        setError(`Payment failed: ${response.error.description}`)
      })
    }

    script.onerror = () => setError('Failed to load payment gateway')
    document.body.appendChild(script)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center p-8">
        <div className="animate-pulse flex justify-center mb-4">
          <Image 
            src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" 
            alt="Loading" 
            width={80} 
            height={80} 
          />
        </div>
        <p className="text-amber-300">Loading committees...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-amber-300 mb-2">Error</h2>
      <p className="text-gray-300 max-w-md mb-4">{error}</p>
      <Button 
        onClick={() => window.location.reload()} 
        className="mt-4 bg-amber-600 hover:bg-amber-700 text-black"
      >
        Try Again
      </Button>
    </div>
  )

  if (!registrationOpen) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
        <Lock className="w-12 h-12 text-amber-500 mb-4" />
        <h1 className="text-3xl font-bold text-amber-300 mb-6">Registration Currently Closed</h1>
        
        <div className="max-w-md bg-black/30 border border-amber-800/30 rounded-xl p-6 space-y-6 mb-8">
          <h2 className="text-xl font-semibold text-amber-300 mb-4">Upcoming Registration Phases</h2>
          
          <div className="space-y-4">
            {REGISTRATION_PHASES.map((phase, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${currentPhase?.name === phase.name ? 'border-amber-500 bg-amber-900/20' : 'border-amber-800/30'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-white">{phase.name}</h3>
                  <span className="text-sm text-amber-300">
                    {isDoubleDel ? `₹${phase.doublePrice}` : `₹${phase.singlePrice}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {new Date() < phase.startDate ? 'Starts soon' : 'Ended'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-400 max-w-md mb-6">
          Registration will open during the specified phases. Please check back during the active registration period.
        </p>
        
        <div className="flex items-center gap-2 text-amber-300">
          <Clock className="w-5 h-5" />
          <span>Event Dates: July 5-6, 2025</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}

      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-amber-800/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" 
                alt="KIMUN Logo" 
                width={40} 
                height={40} 
                className="mr-2" 
              />
              <span className="text-lg font-bold text-amber-300 hidden sm:inline-block">
                Kalinga International MUN
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-amber-900/30 px-3 py-1 rounded-full text-xs text-amber-300 flex items-center gap-1">
              <Unlock className="w-3 h-3" />
              <span>{currentPhase?.name}</span>
            </div>
            <div className="text-amber-300">
              Step {step + 1} of 6
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 pt-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl shadow-lg p-8"
        >
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold text-amber-300 mb-6 flex items-center gap-2">
                <Sparkles className="text-amber-400" /> Event Details
              </h1>
              
              <div className="space-y-6">
                <div className="bg-black/30 border border-amber-800/30 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-amber-300 mb-4">Event Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="text-amber-400" />
                      <div>
                        <p className="text-gray-400">Dates</p>
                        <p className="text-white">July 5-6, 2025</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="text-amber-400" />
                      <div>
                        <p className="text-gray-400">Venue</p>
                        <p className="text-white">ASBM University, Bhubaneswar</p>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="bg-black/30 border border-amber-800/30 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-amber-300 mb-4">Committees & Portfolios</h2>
                  <div className="space-y-4">
                    {committees.map(committee => (
                      <div key={committee.id} className="border-b border-amber-800/30 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{committee.emoji}</span>
                            <h3 className="font-semibold">{committee.name}</h3>
                          </div>
                          <span className="text-amber-300">
                            {committee.portfolios.filter(p => p.isVacant).length} vacancies
                          </span>
                        </div>
                        {committee.isOnline && (
                          <span className="text-xs text-blue-300">Online Committee</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(1)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-black py-6 rounded-xl text-lg group"
              >
                Continue to Registration
                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold text-amber-300 mb-6 flex items-center gap-2">
                <Sparkles className="text-amber-400" /> Delegation Type
              </h1>
              
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <label className="flex items-center gap-4 p-6 bg-black/30 border border-amber-800/30 rounded-xl cursor-pointer hover:border-amber-500 transition-colors">
                    <input
                      type="radio"
                      name="delegation"
                      checked={!isDoubleDel}
                      onChange={() => setIsDoubleDel(false)}
                      className="form-radio h-5 w-5 text-amber-500"
                      required
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-white">Single Delegation</h3>
                      <p className="text-gray-400">₹{currentPhase?.singlePrice} per delegate</p>
                    </div>
                  </label>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <label className="flex items-center gap-4 p-6 bg-black/30 border border-amber-800/30 rounded-xl cursor-pointer hover:border-amber-500 transition-colors">
                    <input
                      type="radio"
                      name="delegation"
                      checked={isDoubleDel}
                      onChange={() => setIsDoubleDel(true)}
                      className="form-radio h-5 w-5 text-amber-500"
                      required
                      disabled={selectedCommittee?.isOnline}
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-white">Double Delegation</h3>
                      <p className="text-gray-400">₹{currentPhase?.doublePrice} for two delegates</p>
                      {selectedCommittee?.isOnline && (
                        <p className="text-xs text-red-400 mt-1">Not available for online committees</p>
                      )}
                    </div>
                  </label>
                </motion.div>
              </div>

              <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-4 text-center">
                <p className="text-sm text-amber-300">
                  Current Phase: <span className="font-semibold">{currentPhase?.name}</span> (ends {formatDate(currentPhase?.endDate || new Date())})
                </p>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-black py-6 rounded-xl text-lg group"
              >
                Next: Delegate Details
                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold text-amber-300 mb-6 flex items-center gap-2">
                <Users className="text-amber-400" /> Delegate Details
              </h1>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Primary Delegate</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['name', 'email', 'phone', 'institution', 'year', 'course'].map((field) => (
                      <div key={field} className="bg-black/30 border border-amber-800/30 rounded-xl p-4 hover:border-amber-500 transition-colors">
                        <input
                          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                          className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
                          value={delegateInfo.delegate1[field as keyof typeof delegateInfo.delegate1]}
                          onChange={(e) => handleInputChange('delegate1', field, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                    <div className="bg-black/30 border border-amber-800/30 rounded-xl p-4 hover:border-amber-500 transition-colors">
                      <input
                        type="number"
                        min="0"
                        placeholder="MUNs Attended"
                        className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
                        value={delegateInfo.delegate1.experience}
                        onChange={(e) => handleInputChange('delegate1', 'experience', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {isDoubleDel && !selectedCommittee?.isOnline && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Secondary Delegate</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['name', 'email', 'phone', 'institution', 'year', 'course'].map((field) => (
                        <div key={field} className="bg-black/30 border border-amber-800/30 rounded-xl p-4 hover:border-amber-500 transition-colors">
                          <input
                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                            className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
                            value={delegateInfo.delegate2?.[field as keyof typeof delegateInfo.delegate1] || ''}
                            onChange={(e) => handleInputChange('delegate2', field, e.target.value)}
                            required={isDoubleDel}
                          />
                        </div>
                      ))}
                      <div className="bg-black/30 border border-amber-800/30 rounded-xl p-4 hover:border-amber-500 transition-colors">
                        <input
                          type="number"
                          min="0"
                          placeholder="MUNs Attended"
                          className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
                          value={delegateInfo.delegate2?.experience || ''}
                          onChange={(e) => handleInputChange('delegate2', 'experience', e.target.value)}
                          required={isDoubleDel}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-amber-600 text-amber-300 hover:bg-amber-800 hover:text-white py-6 rounded-xl text-lg"
                >
                  Back
                </Button>
                <Button
                  onClick={() => validateStep() ? setStep(3) : setError('Please fill all fields')}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-black py-6 rounded-xl text-lg group"
                >
                  Next: Committee Selection
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold text-amber-300 mb-6 flex items-center gap-2">
                <Globe className="text-amber-400" /> Committee Selection
              </h1>
              
              <div className="grid grid-cols-1 gap-4">
                {committees.map(committee => (
                  <motion.div
                    key={committee.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`bg-black/30 border ${committee.isOnline ? 'border-blue-500/30' : 'border-amber-800/30'} rounded-xl p-6 cursor-pointer hover:border-amber-500 transition-colors ${
                      selectedCommittee?.id === committee.id ? 'ring-2 ring-amber-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedCommittee(committee)
                      if (committee.isOnline) {
                        setIsDoubleDel(false)
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{committee.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h2 className="text-xl font-bold text-white">{committee.name}</h2>
                          {committee.isOnline && (
                            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">
                              Online Committee
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400">
                          {committee.portfolios.filter(p => p.isVacant).length} portfolios available
                          {committee.isOnline && (
                            <span className="text-blue-300 ml-2">₹199 per delegate</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 border-amber-600 text-amber-300 hover:bg-amber-800 hover:text-white py-6 rounded-xl text-lg"
                >
                  Back
                </Button>
                <Button
                  onClick={() => selectedCommittee ? setStep(4) : setError('Please select a committee')}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-black py-6 rounded-xl text-lg group"
                >
                  Next: Portfolio Selection
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold text-amber-300 mb-6 flex items-center gap-2">
                <Users className="text-amber-400" /> Portfolio Selection
              </h1>
              
              {selectedCommittee?.portfolios.filter(p => 
                p.isVacant && 
                (isDoubleDel ? p.isDoubleDelAllowed : true)
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-black/30 border border-amber-800/30 rounded-xl">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                  <p className="text-xl text-white">No available portfolios matching your criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {selectedCommittee?.portfolios
                    .filter(p => 
                      p.isVacant && 
                      (isDoubleDel ? p.isDoubleDelAllowed : true) &&
                      getAverageExperience() >= p.minExperience
                    )
                    .map(portfolio => (
                      <motion.div
                        key={portfolio.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`bg-black/30 border ${selectedCommittee.isOnline ? 'border-blue-500/30' : 'border-amber-800/30'} rounded-xl p-4 cursor-pointer hover:border-amber-500 transition-colors ${
                          selectedPortfolio?.id === portfolio.id ? 'ring-2 ring-amber-500' : ''
                        }`}
                        onClick={() => setSelectedPortfolio(portfolio)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {Flags[portfolio.countryCode] && React.createElement(
                              Flags[portfolio.countryCode], 
                              { className: 'w-6 h-6 rounded-sm' }
                            )}
                            <h4 className="text-lg font-bold text-white">{portfolio.country}</h4>
                          </div>
                          {selectedPortfolio?.id === portfolio.id && (
                            <CheckCircle className="text-green-500" />
                          )}
                        </div>
                        {selectedCommittee.isOnline && (
                          <p className="text-xs text-blue-300 mt-2">Online Committee - ₹199</p>
                        )}
                      </motion.div>
                    ))}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(3)}
                  variant="outline"
                  className="flex-1 border-amber-600 text-amber-300 hover:bg-amber-800 hover:text-white py-6 rounded-xl text-lg"
                >
                  Back
                </Button>
                <Button
                  onClick={() => selectedPortfolio ? setStep(5) : setError('Please select a portfolio')}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-black py-6 rounded-xl text-lg group"
                >
                  Next: Additional Services
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.div>
          )}

{step === 5 && (
  <motion.div
    key="step5"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="space-y-6"
  >
    <h1 className="text-3xl font-bold text-amber-300 mb-6 flex items-center gap-2">
      <Hotel className="text-amber-400" /> Additional Services
    </h1>

    <div className="space-y-6">
      {/* Accommodation Section */}
      <div className="bg-black/30 border border-amber-800/30 rounded-xl p-6">
        <h2 className="text-xl font-bold text-amber-300 mb-4">Accommodation (Optional)</h2>
        <div className="space-y-4">
          {[['day1', 'July 5'], ['day2', 'July 6']].map(([day, date]) => (
            <label 
              key={day}
              className={`flex items-center justify-between p-4 rounded-lg transition-colors border ${
                additionalServices.accommodation[day as 'day1' | 'day2'] 
                  ? 'bg-amber-900/20 border-amber-500' 
                  : 'bg-black/20 border-amber-800/30 hover:bg-amber-900/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={additionalServices.accommodation[day as 'day1' | 'day2']}
                  onChange={(e) => handleServiceChange('accommodation', day as 'day1' | 'day2', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-amber-500"
                />
                <div>
                  <p className="text-white">{date}</p>
                  <p className="text-sm text-gray-400">ASBM University Hostel</p>
                </div>
              </div>
              <span className="text-amber-300">₹200</span>
            </label>
          ))}
        </div>
      </div>

      {/* Travel Bus Service Section */}
      <div className="bg-black/30 border border-amber-800/30 rounded-xl p-6">
        <h2 className="text-xl font-bold text-amber-300 mb-4">Travel Bus Service (Optional)</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
          {BUS_ROUTES.map(route => (
  <motion.div
    key={route.id}
    whileHover={{ scale: 1.02 }}
    className={`p-4 rounded-lg border cursor-pointer relative ${
      additionalServices.travelBus.route === route.id 
        ? 'border-amber-500 bg-amber-900/20' 
        : 'border-amber-800/30'
    }`}
    onClick={() => {
      if (additionalServices.travelBus.route === route.id) {
        handleRouteChange('')
      } else {
        handleRouteChange(route.id)
      }
      setShowMap(true)
    }}
  >
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white">{route.name}</h3>
        <p className="text-sm text-gray-400 mt-1">Travel Route - ₹200</p> {/* 👈 Add this line */}
      </div>
      {additionalServices.travelBus.route === route.id && (
        <CheckCircle className="text-green-500 flex-shrink-0" />
      )}
    </div>
  </motion.div>
))}
          </div>

          
        </div>
      </div>
    </div>

    <div className="flex gap-4">
      <Button
        onClick={() => setStep(4)}
        variant="outline"
        className="flex-1 border-amber-600 text-amber-300 hover:bg-amber-800 hover:text-white py-6 rounded-xl text-lg"
      >
        Back
      </Button>
      <Button
        onClick={() => setStep(6)}
        className="flex-1 bg-amber-600 hover:bg-amber-700 text-black py-6 rounded-xl text-lg group"
      >
        Next: Confirmation
        <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  </motion.div>
)}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold text-amber-300 mb-6 flex items-center gap-2">
                <CheckCircle className="text-green-500" /> Final Confirmation
              </h1>
              
              <div className="bg-black/30 border border-amber-800/30 rounded-xl p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-amber-300 border-b border-amber-800/30 pb-2">
                    Registration Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400">Committee</p>
                      <p className="text-white">{selectedCommittee?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Portfolio</p>
                      <p className="text-white">{selectedPortfolio?.country}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Delegation Type</p>
                      <p className="text-white">
                        {isDoubleDel ? 'Double Delegation' : 'Single Delegation'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Registration Phase</p>
                      <p className="text-white">{currentPhase?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-amber-800/30">
                  <h3 className="text-lg font-semibold text-amber-300 mb-4">
                    Additional Services
                  </h3>
                  {(additionalServices.accommodation.day1 || additionalServices.accommodation.day2) && (
                    <div className="mb-4">
                      <h4 className="text-gray-400 mb-2">Accommodation:</h4>
                      <div className="space-y-2">
                        {additionalServices.accommodation.day1 && <p className="text-white">July 5 - ₹200</p>}
                        {additionalServices.accommodation.day2 && <p className="text-white">July 6 - ₹200</p>}
                      </div>
                    </div>
                  )}

                  {additionalServices.travelBus.route && (
                    <div className="mb-4">
                      <h4 className="text-gray-400 mb-2">Travel Route:</h4>
                      <p className="text-white">
                        {BUS_ROUTES.find(r => r.id === additionalServices.travelBus.route)?.name}
                      </p>
                      
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-amber-800/30">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal:</span>
                      <span className="text-amber-300">₹{(calculatePrice() / 1.03).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tax (3%):</span>
                      <span className="text-amber-300">₹{(calculatePrice() * 0.03).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3">
                      <h3 className="text-xl font-semibold text-white">Total:</h3>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-300">₹{calculatePrice()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(5)}
                  variant="outline"
                  className="flex-1 border-amber-600 text-amber-300 hover:bg-amber-800 hover:text-white py-6 rounded-xl text-lg"
                >
                  Back
                </Button>
                <Button
                  onClick={initiatePayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl text-lg group"
                >
                  Confirm & Pay Now
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
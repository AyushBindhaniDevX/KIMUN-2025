'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Confetti from 'react-confetti'
import { Sparkles, CheckCircle, Globe, Users, Settings, AlertCircle } from 'lucide-react'
import Flags from 'country-flag-icons/react/3x2'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, push, update, query, orderByChild, equalTo } from 'firebase/database'

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

type DelegateInfo = {
  name: string
  email: string
  phone: string
  institution: string
  year: string
  course: string
  experience: number
}

// Firebase configuration
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

export default function RegistrationPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [delegateInfo, setDelegateInfo] = useState<DelegateInfo>({
    name: '',
    email: '',
    phone: '',
    institution: '',
    year: '',
    course: '',
    experience: 0
  })

  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [isDoubleDel, setIsDoubleDel] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

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
        setError('Failed to load committees')
        setLoading(false)
      }
    }

    fetchCommittees()
  }, [])

  const handleInputChange = (field: keyof DelegateInfo, value: string | number) => {
    setDelegateInfo(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = () => {
    const { name, email, phone, institution, year, course, experience } = delegateInfo
    return (
      name.trim() !== '' &&
      email.trim() !== '' &&
      phone.trim() !== '' &&
      institution.trim() !== '' &&
      year.trim() !== '' &&
      course.trim() !== '' &&
      experience >= 0
    )
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
        timestamp: Date.now()
      })

      const portfolioRef = ref(db, `committees/${selectedCommittee.id}/portfolios/${selectedPortfolio.id}`)
      await update(portfolioRef, { isVacant: false })

      return newRegistration.key
    } catch (err) {
      console.error('Registration failed:', err)
      throw new Error('Failed to save registration')
    }
  }

  const initiatePayment = async () => {
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
        amount: 50000,
        currency: 'INR',
        name: 'MUN Registration',
        description: 'Registration Fee',
        image: '/logo.png',
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
          name: delegateInfo.name,
          email: delegateInfo.email,
          contact: delegateInfo.phone
        },
        theme: { color: '#3399cc' },
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

  if (loading) return <div className="text-center p-8">Loading committees...</div>
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
      <p className="text-gray-600 max-w-md mb-4">{error}</p>
      <Button onClick={() => window.location.reload()} className="mt-4">
        Try Again
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 relative overflow-hidden">
      {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}

      {/* Admin Panel Toggle */}
      <button
        onClick={() => setIsAdmin(!isAdmin)}
        className="fixed bottom-4 left-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all"
      >
        <Settings className="w-6 h-6" />
      </button>

      <div className="max-w-2xl mx-auto p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          {isAdmin ? (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Live Matrix</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {committees.map(committee =>
                  committee.portfolios.map(portfolio => (
                    <div
                      key={portfolio.id}
                      className="bg-gray-100 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {Flags[portfolio.countryCode] && React.createElement(Flags[portfolio.countryCode], {
                          className: 'w-6 h-6'
                        })}
                        <div>
                          <p className="text-sm text-gray-600 font-medium">{committee.name}</p>
                          <p className="text-gray-800 font-medium">{portfolio.country}</p>
                          <p className={`text-sm ${portfolio.isVacant ? 'text-green-600' : 'text-red-600'}`}>
                            {portfolio.isVacant ? 'Vacant' : 'Occupied'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3, 4, 5].map(num => (
                  <div key={num} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                      ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {num}
                    </div>
                    {num < 5 && <div className="w-8 h-[2px] bg-gray-200" />}
                  </div>
                ))}
              </div>

              <AnimatePresence mode='wait'>
                {/* Step 1: Delegation Type */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <Sparkles className="text-yellow-500" /> Delegation Type
                    </h1>
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 p-4 bg-gray-100 rounded-xl cursor-pointer">
                        <input
                          type="radio"
                          name="delegation"
                          checked={!isDoubleDel}
                          onChange={() => setIsDoubleDel(false)}
                          className="form-radio h-5 w-5 text-blue-600"
                          required
                        />
                        <span className="text-gray-700">Single Delegation</span>
                      </label>
                      <label className="flex items-center gap-2 p-4 bg-gray-100 rounded-xl cursor-pointer">
                        <input
                          type="radio"
                          name="delegation"
                          checked={isDoubleDel}
                          onChange={() => setIsDoubleDel(true)}
                          className="form-radio h-5 w-5 text-blue-600"
                          required
                        />
                        <span className="text-gray-700">Double Delegation</span>
                      </label>
                    </div>
                    <Button
                      onClick={() => setStep(2)}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl text-lg"
                    >
                      Next → Delegate Details
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Delegate Details */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <Sparkles className="text-yellow-500" /> Delegate Details
                    </h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(delegateInfo).map((field) => (
                        <div key={field} className="bg-gray-100 rounded-xl p-4">
                          <input
                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                            className="w-full bg-transparent text-gray-700 placeholder-gray-500 focus:outline-none"
                            value={delegateInfo[field as keyof DelegateInfo]}
                            onChange={(e) => handleInputChange(field as keyof DelegateInfo, e.target.value)}
                            required
                            type={field === 'experience' ? 'number' : 'text'}
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => validateStep() ? setStep(3) : setError('Please fill all fields')}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl text-lg"
                    >
                      Next → Committee Selection
                    </Button>
                  </motion.div>
                )}

                {/* Step 3: Committee Selection */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <Globe className="text-blue-500" /> Committee Selection
                    </h1>
                    <div className="grid grid-cols-1 gap-4">
                      {committees.map(committee => (
                        <motion.div
                          key={committee.id}
                          whileHover={{ scale: 1.02 }}
                          className={`bg-gray-100 rounded-xl p-6 cursor-pointer ${
                            selectedCommittee?.id === committee.id ? 'ring-2 ring-blue-400' : ''
                          }`}
                          onClick={() => setSelectedCommittee(committee)}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">{committee.emoji}</span>
                            <h2 className="text-xl font-bold text-gray-800">{committee.name}</h2>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <Button
                      onClick={() => selectedCommittee ? setStep(4) : setError('Please select a committee')}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl text-lg"
                    >
                      Next → Portfolio Selection
                    </Button>
                  </motion.div>
                )}

                {/* Step 4: Portfolio Selection */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <Users className="text-blue-500" /> Portfolio Selection
                    </h1>
                    {selectedCommittee?.portfolios.filter(p => 
                      p.isVacant && 
                      (isDoubleDel ? p.isDoubleDelAllowed : true) &&
                      delegateInfo.experience >= p.minExperience
                    ).length === 0 ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <AlertCircle className="w-12 h-12 text-red-600" />
                        <p className="text-xl text-gray-800">No available portfolios matching your criteria</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedCommittee?.portfolios
                          .filter(p => 
                            p.isVacant && 
                            (isDoubleDel ? p.isDoubleDelAllowed : true) &&
                            delegateInfo.experience >= p.minExperience
                          )
                          .map(portfolio => (
                            <motion.div
                              key={portfolio.id}
                              whileHover={{ scale: 1.02 }}
                              className={`bg-gray-100 rounded-xl p-4 cursor-pointer ${
                                selectedPortfolio?.id === portfolio.id ? 'ring-2 ring-blue-400' : ''
                              }`}
                              onClick={() => setSelectedPortfolio(portfolio)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  {Flags[portfolio.countryCode] && React.createElement(
                                    Flags[portfolio.countryCode], 
                                    { className: 'w-6 h-6' }
                                  )}
                                  <h4 className="text-lg font-bold text-gray-800">{portfolio.country}</h4>
                                </div>
                                {selectedPortfolio?.id === portfolio.id && (
                                  <CheckCircle className="text-green-500" />
                                )}
                              </div>
                
                            </motion.div>
                          ))}
                      </div>
                    )}
                    <Button
                      onClick={() => selectedPortfolio ? setStep(5) : setError('Please select a portfolio')}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl text-lg"
                    >
                      Next → Confirmation
                    </Button>
                  </motion.div>
                )}

                {/* Step 5: Confirmation */}
                {step === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <CheckCircle className="text-green-500" /> Confirmation
                    </h1>
                    <div className="bg-gray-100 rounded-xl p-6 space-y-4">
                      <p><strong>Name: (Double Delegation: Name1 , Name2)</strong> {delegateInfo.name}</p>
                      <p><strong>Email:</strong> {delegateInfo.email}</p>
                      <p><strong>Phone:</strong> {delegateInfo.phone}</p>
                      <p><strong>Institution:</strong> {delegateInfo.institution}</p>
                      <p><strong>Year:</strong> {delegateInfo.year}</p>
                      <p><strong>Course:</strong> {delegateInfo.course}</p>
                      <p><strong>Experience:</strong> {delegateInfo.experience} years</p>
                      <p><strong>Committee:</strong> {selectedCommittee?.name}</p>
                      <p><strong>Portfolio:</strong> {selectedPortfolio?.country}</p>
                    </div>
                    <Button
                      onClick={initiatePayment}
                      className="w-full bg-green-600 text-white py-3 rounded-xl text-lg"
                    >
                      Pay & Confirm Registration
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
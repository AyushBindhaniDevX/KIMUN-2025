'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Confetti from 'react-confetti'
import { Sparkles, CheckCircle, Globe, Users, Settings, AlertCircle } from 'lucide-react'
import Flags from 'country-flag-icons/react/3x2'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, push, update } from 'firebase/database'

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
  delegate1: {
    name: string
    email: string
    phone: string
    institution: string
    year: string
    course: string
    experience: string // Changed to string for placeholder handling
  }
  delegate2?: {
    name: string
    email: string
    phone: string
    institution: string
    year: string
    course: string
    experience: string // Changed to string for placeholder handling
  }
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
    delegate1: {
      name: '',
      email: '',
      phone: '',
      institution: '',
      year: '',
      course: '',
      experience: '' // Default experience set to empty string
    }
  })
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [isDoubleDel, setIsDoubleDel] = useState(false)

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

  const calculatePrice = () => {
    return isDoubleDel ? 1299 : 2499 // Example prices
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
        averageExperience: getAverageExperience() // Save average experience
      })

      const portfolioRef = ref(db, `committees/${selectedCommittee.id}/portfolios/${selectedPortfolio.id}`)
      await update(portfolioRef, { isVacant: false })

     // Prepare email data
const emailData = {
  email: delegateInfo.delegate1.email, // Primary Delegate Email
  name: delegateInfo.delegate1.name, // Primary Delegate Name
  registrationId: newRegistration?.key, // Ensure it's defined
  committee: selectedCommittee?.name, // Send committee name
  portfolio: selectedPortfolio?.country, // Send portfolio (country name)
};


// Send Confirmation Email
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
    const amount = calculatePrice() * 100 // Convert to paise
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
        name: 'MUN Registration',
        description: `Registration Fee for ${isDoubleDel ? 'Double Delegation' : 'Single Delegation'}`,
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
          name: delegateInfo.delegate1.name,
          email: delegateInfo.delegate1.email,
          contact: delegateInfo.delegate1.phone
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

      <div className="max-w-2xl mx-auto p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
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
              <div className="space-y-8">
                {/* Primary Delegate */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Primary Delegate</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['name', 'email', 'phone', 'institution', 'year', 'course'].map((field) => (
                      <div key={field} className="bg-gray-100 rounded-xl p-4">
                        <input
                          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                          className="w-full bg-transparent text-gray-700 placeholder-gray-500 focus:outline-none"
                          value={delegateInfo.delegate1[field as keyof typeof delegateInfo.delegate1]}
                          onChange={(e) => handleInputChange('delegate1', field, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                    <div className="bg-gray-100 rounded-xl p-4">
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter No of MUNs Attended"
                        className="w-full bg-transparent text-gray-700 placeholder-gray-500 focus:outline-none"
                        value={delegateInfo.delegate1.experience}
                        onChange={(e) => handleInputChange('delegate1', 'experience', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Delegate */}
                {isDoubleDel && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Secondary Delegate</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['name', 'email', 'phone', 'institution', 'year', 'course'].map((field) => (
                        <div key={field} className="bg-gray-100 rounded-xl p-4">
                          <input
                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                            className="w-full bg-transparent text-gray-700 placeholder-gray-500 focus:outline-none"
                            value={delegateInfo.delegate2?.[field as keyof typeof delegateInfo.delegate1] || ''}
                            onChange={(e) => handleInputChange('delegate2', field, e.target.value)}
                            required={isDoubleDel}
                          />
                        </div>
                      ))}
                      <div className="bg-gray-100 rounded-xl p-4">
                        <input
                          type="number"
                          min="0"
                          placeholder="Enter No of MUNs Attended"
                          className="w-full bg-transparent text-gray-700 placeholder-gray-500 focus:outline-none"
                          value={delegateInfo.delegate2?.experience || ''}
                          onChange={(e) => handleInputChange('delegate2', 'experience', e.target.value)}
                          required={isDoubleDel}
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                getAverageExperience() >= p.minExperience
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
                      getAverageExperience() >= p.minExperience
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
                <p className="font-semibold text-lg">Total Fee: ₹{calculatePrice()}</p>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Primary Delegate:</h4>
                  <p>Name: {delegateInfo.delegate1.name}</p>
                  <p>Email: {delegateInfo.delegate1.email}</p>
                  <p>Phone: {delegateInfo.delegate1.phone}</p>
                  <p>Experience: {delegateInfo.delegate1.experience || '0'} MUNs</p>
                </div>
                
                {isDoubleDel && delegateInfo.delegate2 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">Secondary Delegate:</h4>
                    <p>Name: {delegateInfo.delegate2.name}</p>
                    <p>Email: {delegateInfo.delegate2.email}</p>
                    <p>Phone: {delegateInfo.delegate2.phone}</p>
                    <p>Experience: {delegateInfo.delegate2.experience || '0'} MUNs</p>
                  </div>
                )}

                {isDoubleDel && (
                  <p className="font-semibold">Average Experience: {getAverageExperience()} MUNs</p>
                )}

                <p>Institution: {delegateInfo.delegate1.institution}</p>
                <p>Year: {delegateInfo.delegate1.year}</p>
                <p>Course: {delegateInfo.delegate1.course}</p>
                <p>Committee: {selectedCommittee?.name}</p>
                <p>Portfolio: {selectedPortfolio?.country}</p>
              </div>
              <Button
                onClick={initiatePayment}
                className="w-full bg-green-600 text-white py-3 rounded-xl text-lg"
              >
                Pay & Confirm Registration
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
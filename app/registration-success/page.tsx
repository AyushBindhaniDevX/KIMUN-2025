'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database'
import { initializeApp } from 'firebase/app'
import Barcode from 'react-barcode'
import html2canvas from 'html2canvas'
import { CheckCircle, Download, Loader2, AlertCircle } from 'lucide-react'
import Flags from 'country-flag-icons/react/3x2'

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

type RegistrationData = {
  id: string
  committeeId: string
  delegateInfo: {
    name: string
    email: string
    phone: string
    institution: string
    year: string
    course: string
    experience: string
  }
  paymentId: string
  portfolioId: string
  timestamp: number
}

type CommitteeData = {
  name: string
  portfolios: {
    [key: string]: {
      country: string
      countryCode: string
    }
  }
}

export default function RegistrationSuccess() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const registrationId = searchParams.get('registrationId')
  
  const [registration, setRegistration] = useState<RegistrationData | null>(null)
  const [committee, setCommittee] = useState<string>('')  
  const [portfolio, setPortfolio] = useState<string>('')  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [zone, setZone] = useState<number>(0) // Add zone state
  const idCardRef = useRef<HTMLDivElement>(null)

  const getFlagComponent = (countryCode: string) => {
    const Flag = Flags[countryCode as keyof typeof Flags]
    return Flag ? React.createElement(Flag, { className: 'w-8 h-8 rounded-sm' }) : null
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        if (!paymentId) throw new Error('Missing payment ID')
        
        // Query registrations by paymentId
        const registrationsRef = query(
          ref(db, 'registrations'),
          orderByChild('paymentId'),
          equalTo(paymentId)
        )
  
        const snapshot = await get(registrationsRef)
        
        if (!snapshot.exists()) {
          throw new Error('Registration not found')
        }
  
        const registrations = snapshot.val()
        const [registrationKey, registrationData] = Object.entries(registrations)[0]
        
        // Validate registration ID if provided
        if (registrationId && registrationKey !== registrationId) {
          throw new Error('Registration ID mismatch')
        }
  
        const fullRegistration: RegistrationData = {
          id: registrationKey,
          ...registrationData as Omit<RegistrationData, 'id'>
        }
  
        // Fetch committee data
        const committeeRef = ref(db, `committees/${fullRegistration.committeeId}`)
        const committeeSnapshot = await get(committeeRef)
        const committeeData = committeeSnapshot.val() as CommitteeData
  
        // Get portfolio details
        const portfolioData = committeeData.portfolios[fullRegistration.portfolioId]
  
        setRegistration(fullRegistration)
        setCommittee(committeeData.name)
        setPortfolio(portfolioData.country)
        setLoading(false)
  
        // Set a random zone value between 1 and 5
        const randomZone = Math.floor(Math.random() * 5) + 1
        setZone(randomZone)
  
      } catch (err) {
        console.error('Fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load registration')
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
        logging: true
      })
      
      const link = document.createElement('a')
      link.download = `${registration?.id.slice(-8)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to generate ID card. Please try again.')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin w-8 h-8 mr-2 text-blue-600" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Registration Error</h2>
      <p className="text-gray-600 max-w-md mb-4">{error}</p>
      <p className="text-sm text-gray-500">Payment ID: {paymentId}</p>
    </div>
  )

  if (!registration) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-gray-600">No registration data available</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2">
          {/* Your heading here */}
        </h1>

        {/* ID Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div ref={idCardRef} className="id-card bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Kalinga International Model United Nations 2025</h2>
              <p className="text-gray-600">Delegate Digital ID Card</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column: Delegate Details */}
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-xl p-4">
                  <p className="text-sm text-gray-500 uppercase">Delegate ID</p>
                  <p className="text-lg font-bold text-gray-800">{registration.id.slice(-8).toUpperCase()}</p>
                </div>
             
                <div className="bg-gray-100 rounded-xl p-4">
                  <p className="text-sm text-gray-500 uppercase">Committee</p>
                  <p className="text-lg font-bold text-gray-800">{committee}</p>
                </div>
                <div className="bg-gray-100 rounded-xl p-4">
                  <p className="text-sm text-gray-500 uppercase">Portfolio</p>
                  <p className="text-lg font-bold text-gray-800">{portfolio}</p>
                </div>
              </div>

              {/* Right Column: Additional Details */}
              <div className="space-y-4">

                <div className="bg-gray-100 rounded-xl p-4">
                  <p className="text-sm text-gray-500 uppercase">Venue</p>
                  <p className="text-lg font-bold text-gray-800">BMPS Takshila School Patia</p>
                </div>
                <div className="bg-gray-100 rounded-xl p-4">
                  <p className="text-sm text-gray-500 uppercase">Gate</p>
                  <p className="text-lg font-bold text-gray-800">1 : Zone {zone}</p>
                </div>
                <div className="bg-gray-100 rounded-xl p-4">
                  <p className="text-sm text-gray-500 uppercase">Valid From/To</p>
                  <p className="text-lg font-bold text-gray-800">Feb 16 to June 16 2025</p>
                </div>
              </div>
            </div>
   

            {/* Centered Barcode and Download Button */}
            <div className="text-center mt-8">
              <div className="mb-4">
                <Barcode value={registration.id.slice(-8).toUpperCase()} />
              </div>
              <button onClick={downloadIDCard} className="btn btn-primary mx-auto flex items-center gap-2">
                <Download className="w-5 h-5" /> Download ID Card
              </button>
            </div>
          </div>

          <p className="text-lg font-bold text-gray-800 text-center mt-4">PRESENT THIS ID CARD AT THE REGISTRATION DESK</p>
        </div>
      </div>
    </div>
  )
}

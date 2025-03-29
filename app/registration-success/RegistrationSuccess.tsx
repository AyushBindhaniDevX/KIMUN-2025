'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database'
import { initializeApp, getApps } from 'firebase/app'
import Barcode from 'react-barcode'
import html2canvas from 'html2canvas'
import { Download, Loader2, AlertCircle } from 'lucide-react'

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

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const db = getDatabase(app)

export default function RegistrationSuccess() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const registrationId = searchParams.get('registrationId')
  
  const [registration, setRegistration] = useState<any>(null)
  const [committee, setCommittee] = useState<string>('')
  const [portfolio, setPortfolio] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [zone, setZone] = useState<number>(0)
  const idCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!paymentId) {
      setError('Missing payment ID')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        
        const registrationsRef = query(
          ref(db, 'registrations'),
          orderByChild('paymentId'),
          equalTo(paymentId)
        )

        const snapshot = await get(registrationsRef)
        if (!snapshot.exists()) throw new Error('Registration not found')

        const registrations = snapshot.val()
        const [registrationKey, registrationData] = Object.entries(registrations)[0] as [string, any]
        
        if (registrationId && registrationKey !== registrationId) throw new Error('Registration ID mismatch')

        const fullRegistration = { id: registrationKey, ...registrationData }
        const committeeSnapshot = await get(ref(db, `committees/${fullRegistration.committeeId}`))
        const committeeData = committeeSnapshot.val()

        if (!committeeData) throw new Error('Committee data not found')

        const portfolioData = committeeData.portfolios[fullRegistration.portfolioId]
        if (!portfolioData) throw new Error('Portfolio data not found')

        setRegistration(fullRegistration)
        setCommittee(committeeData.name)
        setPortfolio(portfolioData.country)
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
      const canvas = await html2canvas(idCardRef.current, { useCORS: true, scale: 3 })
      const link = document.createElement('a')
      link.download = `${registration?.id.slice(-8)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      setError('Failed to generate ID card. Please try again.')
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorDisplay message={error} paymentId={paymentId} />
  if (!registration) return <NoData />

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8">Delegate ID Card</h1>
        <div className="bg-white rounded-2xl shadow-xl p-8" ref={idCardRef}>
          <h2 className="text-xl font-bold text-center">KIMUN 2025</h2>
          <p className="text-gray-600 text-center">Delegate Digital ID</p>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <InfoBox title="Delegate ID" value={registration.id.slice(0).toUpperCase()} />
            <InfoBox title="Committee" value={committee} />
            <InfoBox title="Portfolio" value={portfolio} />
            <InfoBox title="Venue" value="BMPS Takshila School Patia" />
            <InfoBox title="Gate" value={`1 : Zone ${zone}`} />
            <InfoBox title="Valid From/To" value="Feb 16 to June 16 2025" />
          </div>
          <div className="text-center mt-6">
            <Barcode value={registration.id.slice(0).toUpperCase()} />
            <button
              onClick={downloadIDCard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" /> Download ID Card
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
  </div>
)

const ErrorDisplay = ({ message, paymentId }: { message: string; paymentId: string | null }) => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
    <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
    <h2 className="text-xl font-semibold">Error</h2>
    <p className="text-gray-600">{message}</p>
    {paymentId && <p className="text-sm text-gray-500">Payment ID: {paymentId}</p>}
  </div>
)

const NoData = () => (
  <div className="min-h-screen flex items-center justify-center">
    <span className="text-gray-600">No registration data available</span>
  </div>
)

const InfoBox = ({ title, value }: { title: string; value: string }) => (
  <div className="bg-gray-100 rounded-xl p-4">
    <p className="text-sm text-gray-500 uppercase">{title}</p>
    <p className="text-lg font-bold text-gray-800">{value}</p>
  </div>
)

'use client'
import { useEffect, useState, useRef, React, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database'
import { initializeApp, getApps } from 'firebase/app'
import Barcode from 'react-barcode'
import html2canvas from 'html2canvas'
import { CheckCircle, Download, Loader2, AlertCircle, ChevronRight, Instagram, Lock, User, Sparkles } from 'lucide-react'
import Flags from 'country-flag-icons/react/3x2'
import Image from 'next/image'
import Link from 'next/link'

// Firebase initialization
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

function RegistrationSuccessContent() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const registrationId = searchParams.get('registrationId')
  
  const [registration, setRegistration] = useState(null)
  const [committee, setCommittee] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [zone, setZone] = useState(0)
  const [showConfetti, setShowConfetti] = useState(true)
  const idCardRef = useRef(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [loginError, setLoginError] = useState('')

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
        const [registrationKey, registrationData] = Object.entries(registrations)[0]
        
        if (registrationId && registrationKey !== registrationId) throw new Error('Registration ID mismatch')

        const fullRegistration = { id: registrationKey, ...registrationData }
        const committeeSnapshot = await get(ref(db, `committees/${fullRegistration.committeeId}`))
        const committeeData = committeeSnapshot.val()

        // Get portfolio details
        const portfolioData = committeeData.portfolios[fullRegistration.portfolioId]

        setRegistration(fullRegistration)
        setCommittee({
          name: committeeData.name,
          emoji: committeeData.emoji
        })
        setPortfolio({
          country: portfolioData.country,
          countryCode: portfolioData.countryCode
        })
        setZone(Math.floor(Math.random() * 5) + 1)
        setLoading(false)
      } catch (err) {
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
        backgroundColor: '#000000'
      })
      const link = document.createElement('a')
      link.download = `KIMUN-ID-${registration?.delegateInfo.delegate1.name.split(' ')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      setError('Failed to generate ID card. Please try again.')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      // Implement your login logic here
      // For demo purposes, we'll just check if email matches
      if (email !== registration?.delegateInfo.delegate1.email) {
        throw new Error('Invalid credentials')
      }
      // If successful, redirect to dashboard
      window.location.href = `/dashboard/${registration.id}`
    } catch (err) {
      setLoginError(err.message)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorDisplay message={error} paymentId={paymentId} />
  if (!registration) return <NoData />

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Header */}
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
        </div>
      </header>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-black border border-amber-800/30 rounded-2xl p-8 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-amber-300 mb-6 flex items-center gap-2">
                <Lock className="text-amber-400" /> Delegate Login
              </h2>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-gray-300">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/30 border border-amber-800/30 rounded-lg p-3 text-white"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-gray-300">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/30 border border-amber-800/30 rounded-lg p-3 text-white"
                    required
                  />
                </div>
                
                {loginError && (
                  <div className="text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {loginError}
                  </div>
                )}
                
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowLogin(false)}
                    variant="outline"
                    className="flex-1 border-amber-600 text-amber-300 hover:bg-amber-800 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-black"
                  >
                    Login
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto p-6 pt-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-amber-300 flex items-center gap-2">
              <CheckCircle className="text-green-500" /> Registration Complete!
            </h1>
            <span className="bg-green-900/30 px-3 py-1 rounded-full text-xs text-green-300">
              Confirmed
            </span>
          </div>
          
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-4">
              <p className="text-green-300">
                Thank you for registering! Your delegate ID card is ready below. 
                You can download it or login to your delegate dashboard for more information.
              </p>
            </div>
            
            {/* ID Card */}
            <div 
              ref={idCardRef}
              className="bg-black/30 border border-amber-800/30 rounded-xl p-8 relative overflow-hidden"
            >
              {/* Watermark */}
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
                    <h2 className="text-2xl font-bold text-amber-300">KIMUN 2025</h2>
                    <p className="text-gray-400">Delegate Digital ID</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Registration ID</p>
                    <p className="font-mono text-amber-300">{registration.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <InfoBox title="Delegate Name" value={registration.delegateInfo.delegate1.name} />
                  <InfoBox title="Committee" value={
                    <span className="flex items-center gap-2">
                      {committee.emoji} {committee.name}
                    </span>
                  } />
                  <InfoBox title="Portfolio" value={
                    <span className="flex items-center gap-2">
                      {(() => {
                          const FlagIcon = Flags[portfolio.countryCode]
                          return FlagIcon ? <FlagIcon className="w-5 h-5 rounded-sm" /> : null
                        })()}
                        {portfolio.country}
                    </span>
                  } />
                  <InfoBox title="Venue" value="TBA" />
                  <InfoBox title="Gate Zone" value={`Zone ${zone}`} />
                  <InfoBox title="Valid Until" value="July 6, 2025" />
                </div>
                
                <div className="flex justify-center mt-4">
                  <Barcode 
                    value={registration.id.slice(0).toUpperCase()} 
                    background="transparent"
                    lineColor="#f59e0b"
                    width={2}
                    height={50}
                  />
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={downloadIDCard}
                className="w-full bg-amber-600 hover:bg-amber-700 text-black py-4 rounded-xl group"
              >
                <Download className="w-5 h-5 mr-2" />
                Download ID Card
              </Button>
              <Button
                onClick={() => window.location.href = `/delegate`}
                className="w-full bg-black/30 border border-amber-600 text-amber-300 hover:bg-amber-800 hover:text-white py-4 rounded-xl"
              >
                <User className="w-5 h-5 mr-2" />
                Delegate Dashboard
              </Button>
            </div>
            
            {/* Social Links */}
            <div className="pt-6 border-t border-amber-800/30">
              <h3 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
                <Sparkles className="text-amber-400" /> Connect With Us
              </h3>
              <div className="flex justify-center gap-4">
                <a 
                  href="https://www.instagram.com/kalingainternationalmun" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-full hover:opacity-80 transition-opacity"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <Loader2 className="animate-spin w-8 h-8 text-amber-500" />
  </div>
)

const ErrorDisplay = ({ message, paymentId }) => (
  <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
    <h2 className="text-xl font-semibold text-amber-300 mb-2">Error</h2>
    <p className="text-gray-300 max-w-md mb-4">{message}</p>
    {paymentId && <p className="text-sm text-gray-500">Payment ID: {paymentId}</p>}
    <Button 
      onClick={() => window.location.href = '/'}
      className="mt-4 bg-amber-600 hover:bg-amber-700 text-black"
    >
      Return Home
    </Button>
  </div>
)

const NoData = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <span className="text-gray-400">No registration data available</span>
  </div>
)

const InfoBox = ({ title, value }) => (
  <div className="bg-black/30 border border-amber-800/30 rounded-lg p-3">
    <p className="text-xs text-gray-400 uppercase tracking-wider">{title}</p>
    <p className="text-lg font-medium text-white">{value}</p>
  </div>
)

const Button = ({ children, className = '', ...props }) => (
  <button
    className={`flex items-center justify-center transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
)

// Main page component with Suspense boundary
export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RegistrationSuccessContent />
    </Suspense>
  )
}
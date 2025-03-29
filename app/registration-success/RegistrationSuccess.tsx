'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database'
import { initializeApp, getApps } from 'firebase/app'
import Barcode from 'react-barcode'
import html2canvas from 'html2canvas'
import { Download, Loader2, AlertCircle, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import MobileNav from "@/components/mobile-nav"

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
    <div className="min-h-screen bg-zinc-900 text-amber-50 overflow-hidden">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-md border-b border-amber-800/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Image 
                  src="https://media.discordapp.net/attachments/1268556254448455713/1355478819359817789/KIMUN_Logo_Color.png?ex=67e91386&is=67e7c206&hm=069060e64b9b750db76fd94f7b58e95940e6bb791a6c78f672b8361f802b7084&=&format=webp&quality=lossless&width=900&height=900" 
                  alt="Kalinga International MUN Logo" 
                  width={40} 
                  height={40} 
                  className="mr-2"
                />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-lg font-bold text-amber-300 hidden sm:inline-block"
              >
                Kalinga International Model United Nations
              </motion.span>
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            {["Home", "About", "Registration", "Matrix", "Resources", "Committees"].map(
              (item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.5 }}
                >
                  <Link
                    href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                    className="text-amber-200 hover:text-amber-400 transition-colors relative group"
                  >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-amber-400 to-amber-600 transition-all group-hover:w-full"></span>
                  </Link>
                </motion.div>
              ),
            )}
          </nav>
          <MobileNav />
        </div>
      </header>

      {/* Main Content */}
      <section className="relative pt-32 pb-20 min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-900/80 to-zinc-900">
        {/* Gold decorative elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-amber-400 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12 text-center"
          >
            <span className="text-amber-400 text-lg font-medium tracking-widest">REGISTRATION CONFIRMED</span>
            <h1 className="text-4xl md:text-5xl font-bold text-amber-100 mt-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-500">
              Your Exclusive Delegate ID
            </h1>
            <div className="flex justify-center mt-4">
              <Sparkles className="text-amber-400 animate-pulse" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <div 
              className="bg-zinc-800/70 backdrop-blur-sm border border-amber-800/50 rounded-2xl overflow-hidden p-8 shadow-2xl shadow-amber-900/20"
              ref={idCardRef}
            >
              {/* ID Card Header */}
              <div className="text-center mb-8 relative">
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                <h2 className="text-2xl font-bold text-amber-300 tracking-wider">KIMUN 2025</h2>
                <p className="text-amber-200/80 text-sm mt-1">PREMIER DELEGATE CREDENTIALS</p>
              </div>

              {/* ID Card Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <InfoBox title="Delegate ID" value={registration.id.slice(0).toUpperCase()} />
                <InfoBox title="Name" value={registration.name} />
                <InfoBox title="Committee" value={committee} />
                <InfoBox title="Portfolio" value={portfolio} />
                <InfoBox title="Venue" value="BMPS Takshila School Patia" />
                <InfoBox title="Access Zone" value={`GOLD ${zone}`} />
              </div>

              {/* Barcode Section */}
              <div className="text-center">
                <div className="bg-zinc-900/50 p-4 rounded-lg inline-block border border-amber-800/30">
                  <Barcode 
                    value={registration.id.slice(0).toUpperCase()} 
                    background="transparent"
                    lineColor="#fbbf24"
                    width={1.5}
                    height={60}
                  />
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-500"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-500"></div>
            </div>

            {/* Action Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={downloadIDCard}
                  className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-amber-50 font-bold px-8 py-6 text-lg rounded-lg group shadow-lg shadow-amber-900/30"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download ID Card
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/" passHref>
                  <Button variant="outline" className="border-amber-600 text-amber-300 hover:bg-amber-900/20 hover:text-amber-200 font-bold px-8 py-6 text-lg rounded-lg group shadow-lg shadow-amber-900/10">
                    Back to Home
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-amber-800/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
                <Image 
                  src="https://media.discordapp.net/attachments/1268556254448455713/1355478819359817789/KIMUN_Logo_Color.png?ex=67e91386&is=67e7c206&hm=069060e64b9b750db76fd94f7b58e95940e6bb791a6c78f672b8361f802b7084&=&format=webp&quality=lossless&width=900&height=900" 
                  alt="Kalinga International MUN Logo" 
                  width={30} 
                  height={30} 
                  className="mr-2"
                />
                Kalinga International MUN
              </h3>
              <p className="text-amber-100/70">The premier Model United Nations conference in the region.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-amber-100/70 hover:text-amber-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-amber-100/70 hover:text-amber-400 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/registration" className="text-amber-100/70 hover:text-amber-400 transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/committees" className="text-amber-100/70 hover:text-amber-400 transition-colors">
                    Committees
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/resources" className="text-amber-100/70 hover:text-amber-400 transition-colors">
                    Study Guides
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-amber-100/70 hover:text-amber-400 transition-colors">
                    Rules of Procedure
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-amber-100/70 hover:text-amber-400 transition-colors">
                    Position Papers
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-amber-100/70 hover:text-amber-400 transition-colors">
                    FAQs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-amber-100/70">Email: info@kimun.in.co</li>
                <li className="text-amber-100/70">Phone: +918249979557</li>
                <li className="flex space-x-4 mt-4">
                  <a href="#" className="text-amber-100/70 hover:text-amber-400 transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a href="#" className="text-amber-100/70 hover:text-amber-400 transition-colors">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a href="#" className="text-amber-100/70 hover:text-amber-400 transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-amber-800/20 text-center text-amber-100/50">
            <p>© 2025 Kalinga International MUN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
    <Loader2 className="animate-spin w-8 h-8 text-amber-500" />
  </div>
)

const ErrorDisplay = ({ message, paymentId }: { message: string; paymentId: string | null }) => (
  <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center text-center p-8">
    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
    <h2 className="text-xl font-semibold text-amber-100">Error</h2>
    <p className="text-amber-200">{message}</p>
    {paymentId && <p className="text-sm text-amber-400/70">Payment ID: {paymentId}</p>}
  </div>
)

const NoData = () => (
  <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
    <span className="text-amber-200">No registration data available</span>
  </div>
)

const InfoBox = ({ title, value }: { title: string; value: string }) => (
  <div className="bg-zinc-900/50 rounded-xl p-4 border border-amber-800/30">
    <p className="text-xs text-amber-400 uppercase tracking-wider font-medium">{title}</p>
    <p className="text-lg font-bold text-amber-100 mt-1">{value}</p>
  </div>
)

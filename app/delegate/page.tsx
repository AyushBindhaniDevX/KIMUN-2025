// app/delegate/page.tsx
'use client'
import { useState, useEffect, Suspense } from 'react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Mail, Lock, User, FileText, Award, Download, QrCode, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

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

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

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
}

type CommitteeData = {
  name: string
  description: string
  topics: string[]
  backgroundGuide: string
  rules: string
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
}

function DelegateDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const step = searchParams.get('step')

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [delegate, setDelegate] = useState<DelegateData | null>(null)
  const [committee, setCommittee] = useState<CommitteeData | null>(null)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState({
    login: false,
    verify: false,
    data: false,
    resources: false
  })
  const [error, setError] = useState({
    login: null as string | null,
    verify: null as string | null
  })
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Check for existing session on initial load
  useEffect(() => {
    const storedLoggedIn = localStorage.getItem('delegateLoggedIn') === 'true'
    const storedEmail = localStorage.getItem('delegateEmail')
    
    if (storedLoggedIn) {
      setLoggedIn(true)
      fetchDelegateData(storedEmail || '')
    } else if (storedEmail) {
      setEmail(storedEmail)
      router.push('/delegate?step=verify')
    }
  }, [router])

  const fetchDelegateData = async (email: string) => {
    try {
      setLoading(prev => ({ ...prev, data: true }))
      
      const delegatesRef = ref(db, 'registrations')
      const delegateQuery = query(
        delegatesRef, 
        orderByChild('delegateInfo/delegate1/email'), 
        equalTo(email)
      )
      const snapshot = await get(delegateQuery)

      if (!snapshot.exists()) {
        throw new Error('No delegate found with this email')
      }

      const [key] = Object.keys(snapshot.val())
      const data = snapshot.val()[key]
      
      setDelegate({
        id: key,
        ...data.delegateInfo.delegate1,
        committeeId: data.committeeId,
        portfolioId: data.portfolioId
      })

      fetchCommitteeData(data.committeeId, data.portfolioId)
      fetchMarksData(data.committeeId, data.portfolioId)
      fetchResources()
    } catch (error) {
      console.error('Error fetching delegate data:', error)
      handleLogout()
    } finally {
      setLoading(prev => ({ ...prev, data: false }))
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
          (mark: any) => mark.portfolioId === portfolioId
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
          r.type === 'guide' || r.type === 'rules' || r.type === 'template'
        ))
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(prev => ({ ...prev, resources: false }))
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(prev => ({ ...prev, login: true }))
    setError(prev => ({ ...prev, login: null }))

    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address')
      }

      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send OTP')
      }
      
      localStorage.setItem('delegateEmail', email)
      router.push('/delegate?step=verify')
      toast.success('OTP sent to your email')
    } catch (err: any) {
      setError(prev => ({ ...prev, login: err.message }))
      toast.error(err.message)
    } finally {
      setLoading(prev => ({ ...prev, login: false }))
    }
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(prev => ({ ...prev, verify: true }))
    setError(prev => ({ ...prev, verify: null }))

    try {
      if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
        throw new Error('Please enter a valid 6-digit OTP')
      }

      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Invalid OTP')
      }

      setLoggedIn(true)
      localStorage.setItem('delegateLoggedIn', 'true')
      localStorage.removeItem('delegateEmail')
      
      fetchDelegateData(email)
      router.push('/delegate')
      toast.success('Login successful')
    } catch (err: any) {
      setError(prev => ({ ...prev, verify: err.message }))
      toast.error(err.message)
    } finally {
      setLoading(prev => ({ ...prev, verify: false }))
    }
  }

  const handleLogout = () => {
    setLoggedIn(false)
    setDelegate(null)
    setCommittee(null)
    setPortfolio(null)
    setResources([])
    localStorage.removeItem('delegateLoggedIn')
    localStorage.removeItem('delegateEmail')
    router.push('/delegate')
    toast.info('Logged out successfully')
  }

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
  }

  // Login form (step 1)
  if (!loggedIn && step !== 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors theme="dark" />
        <div className="bg-gradient-to-b from-black to-amber-950/80 border border-amber-800/50 p-8 rounded-xl shadow-lg shadow-amber-900/10 w-full max-w-md">
          <div className="text-center mb-8">
            <Award className="h-12 w-12 text-amber-400 mx-auto" />
            <h1 className="text-3xl font-bold mt-4 text-amber-300">Delegate Portal</h1>
            <p className="text-amber-100/80 mt-2">Sign in to access your dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-amber-200 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-black/70 border border-amber-500/50 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="your@email.com"
                required
                disabled={loading.login}
              />
              {error.login && (
                <p className="mt-1 text-sm text-red-400">{error.login}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700 h-11 text-black font-bold"
              disabled={loading.login}
            >
              {loading.login ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" /> 
                  Send OTP
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // OTP verification form (step 2)
  if (!loggedIn && step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors theme="dark" />
        <div className="bg-gradient-to-b from-black to-amber-950/80 border border-amber-800/50 p-8 rounded-xl shadow-lg shadow-amber-900/10 w-full max-w-md">
          <div className="text-center mb-8">
            <Award className="h-12 w-12 text-amber-400 mx-auto" />
            <h1 className="text-3xl font-bold mt-4 text-amber-300">Verify Your OTP</h1>
            <p className="text-amber-100/80 mt-2">We sent a 6-digit code to {email}</p>
          </div>
          
          <form onSubmit={verifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-amber-200 mb-1">OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-2 bg-black/70 border border-amber-500/50 rounded-lg text-white text-center text-xl tracking-widest focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="123456"
                required
                disabled={loading.verify}
              />
              {error.verify && (
                <p className="mt-1 text-sm text-red-400">{error.verify}</p>
              )}
            </div>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full border-amber-500 text-amber-300 hover:bg-amber-900/30 h-11"
                onClick={() => {
                  setOtp('')
                  router.push('/delegate')
                }}
                disabled={loading.verify}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="w-full bg-amber-600 hover:bg-amber-700 h-11 text-black font-bold"
                disabled={loading.verify}
              >
                {loading.verify ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" /> 
                    Verify & Login
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 text-white">
      <Toaster position="top-right" richColors theme="dark" />
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-amber-800/30">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <Button variant="ghost" className="p-2 rounded-full group-hover:bg-amber-900/30 transition-colors">
              <span className="text-amber-300">Home</span>
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-amber-200 hidden sm:inline">{delegate?.name}</span>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-amber-500 text-amber-300 hover:bg-amber-900/30 h-9"
            >
              <Lock className="h-4 w-4 mr-2" /> 
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-20 pb-16">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 text-white p-6 rounded-xl mb-8 border border-amber-800/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2 text-amber-300">Welcome, {delegate?.name}!</h1>
              <p className="text-amber-100/80">
                {committee?.name} • {portfolio?.country || delegate?.portfolioId}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              <div className="bg-black/50 p-2 rounded-lg border border-amber-800/30">
                <p className="text-xs text-amber-200/80">Delegate ID</p>
                <p className="text-sm font-mono text-amber-300">{delegate?.id?.substring(0, 8)}</p>
              </div>
              {delegate?.id && (
                <div className="bg-white p-2 rounded-lg">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${delegate.id}`}
                    alt="Delegate QR Code"
                    width={80}
                    height={80}
                    className="rounded"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Committee Card */}
          <div 
            className={`bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10 transition-all ${expandedCard === 'committee' ? 'md:col-span-2 lg:col-span-1' : ''}`}
            onClick={() => toggleCard('committee')}
          >
            <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30 flex justify-between items-center cursor-pointer">
              <h2 className="text-xl font-bold text-amber-300 flex items-center">
                <User className="h-5 w-5 mr-2" /> 
                Committee Information
              </h2>
              {expandedCard === 'committee' ? (
                <ChevronUp className="text-amber-300 h-5 w-5" />
              ) : (
                <ChevronDown className="text-amber-300 h-5 w-5" />
              )}
            </div>
            {committee ? (
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-amber-200/80">Committee</p>
                  <p className="font-medium text-amber-100">{committee.name}</p>
                </div>
                <div>
                  <p className="text-sm text-amber-200/80">Description</p>
                  <p className="font-medium text-amber-100">{committee.description}</p>
                </div>
                {expandedCard === 'committee' && (
                  <>
                    <div>
                      <p className="text-sm text-amber-200/80">Topics</p>
                      <div className="mt-2 space-y-2">
                        {committee.topics.filter(t => t && t !== 'TBA').map((topic, i) => (
                          <div key={i} className="bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-800/30">
                            <p className="text-amber-100">{topic}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4">
                      <Link href={committee.backgroundGuide || '#'} target="_blank">
                        <Button className="w-full bg-amber-600 hover:bg-amber-700 text-black">
                          <FileText className="mr-2 h-4 w-4" />
                          View Background Guide
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-6 text-amber-200/80">No committee information available</div>
            )}
          </div>

          {/* Portfolio Card */}
          <div 
            className={`bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10 transition-all ${expandedCard === 'portfolio' ? 'md:col-span-2 lg:col-span-1' : ''}`}
            onClick={() => toggleCard('portfolio')}
          >
            <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30 flex justify-between items-center cursor-pointer">
              <h2 className="text-xl font-bold text-amber-300 flex items-center">
                <FileText className="h-5 w-5 mr-2" /> 
                Portfolio Details
              </h2>
              {expandedCard === 'portfolio' ? (
                <ChevronUp className="text-amber-300 h-5 w-5" />
              ) : (
                <ChevronDown className="text-amber-300 h-5 w-5" />
              )}
            </div>
            {portfolio ? (
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-amber-200/80">Representing</p>
                  <p className="font-medium text-amber-100">{portfolio.country}</p>
                </div>
                <div>
                  <p className="text-sm text-amber-200/80">Status</p>
                  <p className="font-medium text-amber-100">
                    <span className={`inline-block h-3 w-3 rounded-full mr-2 ${delegate?.isCheckedIn ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    {delegate?.isCheckedIn ? 'Checked In' : 'Not Checked In'}
                  </p>
                </div>
                {expandedCard === 'portfolio' && (
                  <>
                    <div>
                      <p className="text-sm text-amber-200/80">Experience Level</p>
                      <p className="font-medium text-amber-100">
                        {portfolio.minExperience === 0 ? 'Beginner' : 
                         portfolio.minExperience === 1 ? 'Intermediate' : 
                         portfolio.minExperience >= 2 ? 'Advanced' : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-amber-200/80">Institution</p>
                      <p className="font-medium text-amber-100">{delegate?.institution || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-amber-200/80">MUN Experience</p>
                      <p className="font-medium text-amber-100">
                        {delegate?.experience || 0} {delegate?.experience === 1 ? 'conference' : 'conferences'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-6 text-amber-200/80">No portfolio information available</div>
            )}
          </div>

          {/* Performance Card */}
<div 
  className={`bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10 transition-all ${expandedCard === 'performance' ? 'md:col-span-2 lg:col-span-1' : ''}`}
  onClick={() => toggleCard('performance')}
>
  <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30 flex justify-between items-center cursor-pointer">
    <h2 className="text-xl font-bold text-amber-300 flex items-center">
      <Award className="h-5 w-5 mr-2" /> 
      Performance Metrics
    </h2>
    {expandedCard === 'performance' ? (
      <ChevronUp className="text-amber-300 h-5 w-5" />
    ) : (
      <ChevronDown className="text-amber-300 h-5 w-5" />
    )}
  </div>
  {delegate?.marks ? (
    <div className="p-6 space-y-4">
      <div>
        <p className="text-sm text-amber-200/80">Total Score</p>
        <p className="text-2xl font-bold text-amber-300">{delegate.marks.total}</p>
      </div>
      {expandedCard === 'performance' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-800/30">
              <p className="text-sm text-amber-200/80">General Speakers List</p>
              <p className="text-lg font-medium text-amber-100">{delegate.marks.gsl}</p>
            </div>
            <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-800/30">
              <p className="text-sm text-amber-200/80">Moderated Caucus 1</p>
              <p className="text-lg font-medium text-amber-100">{delegate.marks.mod1}</p>
            </div>
            <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-800/30">
              <p className="text-sm text-amber-200/80">Moderated Caucus 2</p>
              <p className="text-lg font-medium text-amber-100">{delegate.marks.mod2}</p>
            </div>
            <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-800/30">
              <p className="text-sm text-amber-200/80">Moderated Caucus 3</p>
              <p className="text-lg font-medium text-amber-100">{delegate.marks.mod3}</p>
            </div>
            <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-800/30">
              <p className="text-sm text-amber-200/80">Moderated Caucus 4</p>
              <p className="text-lg font-medium text-amber-100">{delegate.marks.mod4}</p>
            </div>
            <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-800/30">
              <p className="text-sm text-amber-200/80">Lobbying</p>
              <p className="text-lg font-medium text-amber-100">{delegate.marks.lobby}</p>
            </div>
            <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-800/30">
              <p className="text-sm text-amber-200/80">Chits</p>
              <p className="text-lg font-medium text-amber-100">{delegate.marks.chits}</p>
            </div>
            <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-800/30">
              <p className="text-sm text-amber-200/80">Foreign Policy</p>
              <p className="text-lg font-medium text-amber-100">{delegate.marks.fp}</p>
            </div>
            <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-800/30">
              <p className="text-sm text-amber-200/80">Resolution</p>
              <p className="text-lg font-medium text-amber-100">{delegate.marks.doc}</p>
            </div>
            <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-800/30">
              <p className="text-sm text-amber-200/80">Alternative Score</p>
              <p className="text-lg font-medium text-amber-100">{delegate.marks.alt}</p>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-xs text-amber-200/60">
              * Scores are out of 50 total points
            </p>
          </div>
        </>
      )}
    </div>
  ) : (
    <div className="p-6 text-amber-200/80">
      {expandedCard === 'performance' ? (
        <p>Your detailed marks will appear here after committee sessions</p>
      ) : (
        <p>Your marks will appear here after committee sessions</p>
      )}
    </div>
  )}
</div>
        </div>

        {/* Resources Section */}
        <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10 mb-8">
          <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30">
            <h2 className="text-xl font-bold text-amber-300 flex items-center">
              <FileText className="h-5 w-5 mr-2" /> 
              Committee Resources
            </h2>
          </div>
          <div className="p-6">
            {loading.resources ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => (
                  <div 
                    key={resource.id} 
                    className="bg-black/50 p-4 rounded-lg border border-amber-800/30 hover:border-amber-500 transition-colors"
                  >
                    <div className="flex items-start mb-3">
                      <div className="bg-amber-900/30 p-2 rounded-lg mr-3">
                        {resource.type === 'guide' && <FileText className="h-5 w-5 text-amber-400" />}
                        {resource.type === 'rules' && <FileText className="h-5 w-5 text-amber-400" />}
                        {resource.type === 'template' && <FileText className="h-5 w-5 text-amber-400" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-amber-300">{resource.title}</h3>
                        <p className="text-sm text-amber-100/80">{resource.committee || 'General'}</p>
                      </div>
                    </div>
                    <p className="text-sm text-amber-100 mb-4">{resource.description}</p>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button className="bg-amber-600 hover:bg-amber-700 text-black">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-amber-200/80">No resources available for your committee</p>
            )}
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10">
          <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30">
            <h2 className="text-xl font-bold text-amber-300 flex items-center">
              <FileText className="h-5 w-5 mr-2" /> 
              Conference Schedule
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {[
                {
                  day: "Day 1",
                  date: "August 5, 2023",
                  events: [
                    { time: "08:00 - 09:00", title: "Registration", location: "BMPS Main Hall" },
                    { time: "09:00 - 10:30", title: "Opening Ceremony", location: "BMPS Auditorium" },
                    { time: "10:30 - 11:00", title: "Coffee Break", location: "BMPS Lounge" },
                    { time: "11:00 - 13:00", title: "Committee Session I", location: "Assigned Rooms" },
                    { time: "13:00 - 14:00", title: "Lunch Break", location: "BMPS Dining Hall" },
                    { time: "14:00 - 16:00", title: "Committee Session II", location: "Assigned Rooms" },
                    { time: "16:00 - 16:30", title: "Coffee Break", location: "BMPS Lounge" },
                    { time: "16:30 - 18:00", title: "Committee Session III", location: "Assigned Rooms" }
                  ]
                },
                {
                  day: "Day 2",
                  date: "August 6, 2023",
                  events: [
                    { time: "09:00 - 11:00", title: "Committee Session IV", location: "Assigned Rooms" },
                    { time: "11:00 - 11:30", title: "Coffee Break", location: "BMPS Lounge" },
                    { time: "11:30 - 13:30", title: "Committee Session V", location: "Assigned Rooms" },
                    { time: "13:30 - 14:30", title: "Lunch Break", location: "BMPS Dining Hall" },
                    { time: "14:30 - 16:30", title: "Committee Session VI", location: "Assigned Rooms" },
                    { time: "16:30 - 17:00", title: "Coffee Break", location: "BMPS Lounge" },
                    { time: "17:00 - 18:30", title: "Closing Ceremony", location: "BMPS Auditorium" }
                  ]
                }
              ].map((daySchedule, dayIndex) => (
                <div key={dayIndex} className="border-b border-amber-800/30 pb-6 last:border-0 last:pb-0">
                  <h3 className="text-lg font-bold text-amber-300 mb-4">{daySchedule.day} - {daySchedule.date}</h3>
                  <div className="space-y-4">
                    {daySchedule.events.map((event, eventIndex) => (
                      <div key={eventIndex} className="flex items-start">
                        <div className="bg-amber-900/20 px-3 py-1 rounded-lg mr-4 min-w-[100px] text-center">
                          <p className="text-sm font-medium text-amber-300">{event.time}</p>
                        </div>
                        <div>
                          <p className="font-medium text-amber-100">{event.title}</p>
                          <p className="text-sm text-amber-200/80">{event.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DelegateDashboard() {
  return (
    <Suspense>
      <DelegateDashboardContent />
    </Suspense>
  )
<<<<<<< Updated upstream
<<<<<<< Updated upstream
}
=======
}
>>>>>>> Stashed changes
=======
}
>>>>>>> Stashed changes

"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, CheckCircle, Globe, Users, Settings, AlertCircle, 
  ChevronRight, Calendar, Clock, Lock, Unlock, FileText, 
  ShieldCheck, Landmark, Search, ArrowLeft, ArrowRight,
  UserCheck, ClipboardList, CreditCard, MessageSquare, Loader2,
  Scale, Gavel, Globe2, Info, Award, ChevronDown, Mail, LogOut
} from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, push, update } from 'firebase/database'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth'

// --- Firebase configuration ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// --- Interfaces ---
interface Portfolio {
  id: string;
  country: string;
  countryCode: string;
  isDoubleDelAllowed: boolean;
  isVacant: boolean;
  minExperience: number;
}

interface Committee {
  id: string;
  name: string;
  emoji: string;
  portfolios: Portfolio[];
  isOnline?: boolean;
}

interface DelegateData {
  name: string;
  email: string;
  phone: string;
  institution: string;
  year: string;
  course: string;
  experience: string;
}

interface DelegateInfo {
  delegate1: DelegateData;
  delegate2?: DelegateData;
}

// --- Diplomatic Protocols & Constants ---
const BLACKLIST = [
  { email: "d", phone: "2", name: "S", reason: "PREVIOUS PROTOCOL BREACH" },
  { email: "test.user@example.com", phone: "5555555555", name: "Test User", reason: "IDENTITY VERIFICATION FAILED" }
];

const ACCREDITATION_PHASES = [
  { name: "Pre-Early Bird", startDate: new Date('2025-04-14'), endDate: new Date('2025-04-19'), singlePrice: 1, doublePrice: 2499 },
  { name: "Early Bird", startDate: new Date('2025-04-20'), endDate: new Date('2025-05-11'), singlePrice: 1299, doublePrice: 2499 },
  { name: "Phase I Plenary", startDate: new Date('2025-05-12'), endDate: new Date('2025-05-29'), singlePrice: 1299, doublePrice: 2499 },
  { name: "Phase II Plenary", startDate: new Date('2025-05-30'), endDate: new Date('2025-06-14'), singlePrice: 1299, doublePrice: 2499 },
  { name: "Final Convening", startDate: new Date('2025-06-15'), endDate: new Date('2026-12-30'), singlePrice: 999, doublePrice: 1999 }
];

const VALID_COUPONS: Record<string, number> = {
  "BGUDELEGATION": 99,
  "RAVENSHAWDELEGATION": 99,
  "SOADELEGATION": 99,
  "KIMUN2024RECVR1299": 1299,
  "KIMUN2025WINWAR": 100,
};

// --- Educational Institutions ---
const EDUCATIONAL_INSTITUTIONS = [
  "Select Your Institution",
  "Kalinga Institute of Industrial Technology (KIIT)",
  "Kalinga Institute of Social Sciences (KISS)",
  "Ravenshaw University",
  "Buxi Jagabandhu Bidyadhar College (BJB)",
  "Sri Aurobindo Institute of Higher Education (SAIHE)",
  "Cambridge Institute of Technology",
  "Dolphin Institute of Higher Education",
  "IIT Bhubaneswar",
  "NISER Bhubaneswar",
  "SOA University",
  "GIET University",
  "Centurion University",
  "Other Institution"
];

const ACADEMIC_YEARS = [
  "Select Year",
  "1st Year",
  "2nd Year", 
  "3rd Year",
  "4th Year",
  "5th Year+",
  "Post Graduate"
];

const COURSES = [
  "Select Course",
  "BA (Political Science)",
  "BA (History)",
  "BA (Economics)",
  "BA (International Relations)",
  "BBA",
  "B.Com",
  "B.Sc",
  "B.Tech",
  "MBBS",
  "LLB",
  "Other"
];

const EXPERIENCE_LEVELS = [
  { value: "0", label: "Beginner (0 MUNs)" },
  { value: "1-2", label: "Novice (1-2 MUNs)" },
  { value: "3-5", label: "Intermediate (3-5 MUNs)" },
  { value: "6-10", label: "Experienced (6-10 MUNs)" },
  { value: "10+", label: "Expert (10+ MUNs)" }
];

// --- Institutional Components ---
const Button = React.forwardRef<HTMLButtonElement, any>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[#009EDB] text-white hover:bg-[#0077B3] shadow-sm font-bold",
    outline: "border-2 border-[#009EDB] text-[#009EDB] hover:bg-[#F0F8FF] font-bold",
    secondary: "bg-[#4D4D4D] text-white hover:bg-[#333333]",
    ghost: "text-gray-500 hover:bg-gray-100",
    google: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 shadow-sm font-bold"
  }
  const sizes = {
    default: "h-11 px-6 py-2 text-xs",
    lg: "h-14 px-10 text-sm font-black",
    sm: "h-8 px-4 text-[10px]"
  }
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${variants[variant as keyof typeof variants] || variants.default} ${sizes[size as keyof typeof sizes] || sizes.default} ${className}`}
      {...props}
    />
  )
})
Button.displayName = "Button"

const ProgressStep = ({ current, step, label, icon: Icon }: any) => (
  <div className="flex flex-col items-center flex-1 relative">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-500 ${current >= step ? 'bg-[#009EDB] border-[#009EDB] text-white shadow-lg' : 'bg-white border-gray-200 text-gray-400'}`}>
      <Icon size={18} />
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tighter mt-2 text-center transition-colors ${current >= step ? 'text-[#003366]' : 'text-gray-300'}`}>
      {label}
    </span>
    {step < 5 && (
        <div className={`absolute top-5 left-[60%] w-full h-[2px] -z-0 ${current > step ? 'bg-[#009EDB]' : 'bg-gray-100'}`} />
    )}
  </div>
);

// --- Fixed Flag Component using Standard HTML Img ---
const DiplomaticFlag = ({ countryCode, className = "" }: { countryCode: string, className?: string }) => {
  return (
    <img 
      src={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`}
      alt={`${countryCode} Representation`}
      className={`object-contain ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = 'https://flagcdn.com/w80/un.png';
      }}
    />
  );
};

// --- Main Accreditation Page ---
export default function App() {
  const [step, setStep] = useState(1)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [delegateInfo, setDelegateInfo] = useState<DelegateInfo>({
    delegate1: { 
      name: '', 
      email: '', 
      phone: '', 
      institution: EDUCATIONAL_INSTITUTIONS[0], 
      year: ACADEMIC_YEARS[0], 
      course: COURSES[0], 
      experience: '' 
    }
  })
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [isDoubleDel, setIsDoubleDel] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<any>(null)
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [whatsappRegistration, setWhatsappRegistration] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Google Auth State
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  const app = initializeApp(firebaseConfig)
  const db = getDatabase(app)
  const auth = getAuth(app)
  const googleProvider = new GoogleAuthProvider()

  useEffect(() => {
    // Auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
        // Auto-fill email if user is logged in
        if (!delegateInfo.delegate1.email) {
          handleInputChange('delegate1', 'email', user.email || '')
        }
      } else {
        setUser(null)
      }
    })

    const checkRegistrationPhase = () => {
      const now = new Date()
      let activePhase = null
      for (const phase of ACCREDITATION_PHASES) {
        const start = new Date(phase.startDate); const end = new Date(phase.endDate); end.setHours(23, 59, 59, 999)
        if (now >= start && now <= end) { activePhase = phase; break }
      }
      setCurrentPhase(activePhase); setRegistrationOpen(!!activePhase)
    }
    checkRegistrationPhase()
    
    const fetchCommittees = async () => {
      try {
        const snapshot = await get(ref(db, 'committees'))
        if (snapshot.exists()) {
          const data = snapshot.val()
          const arr = Object.keys(data).map(key => ({
            id: key, ...data[key],
            portfolios: Object.keys(data[key].portfolios || {}).map(pk => ({
              id: pk, ...data[key].portfolios[pk]
            }))
          }))
          setCommittees(arr)
        }
        setLoading(false)
      } catch (err) {
        setError('Accreditation Database Sync Failed'); setLoading(false)
      }
    }
    fetchCommittees()

    return () => unsubscribe()
  }, [db, auth])

  // --- Auth Handlers ---
  const signInWithGoogle = async () => {
    try {
      setAuthLoading(true)
      setError('')
      
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      
      setUser(user)
      
      // Auto-fill email field with Google account email
      if (!delegateInfo.delegate1.email) {
        handleInputChange('delegate1', 'email', user.email || '')
      }
      
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      setError('Failed to sign in with Google. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      setError('Failed to logout')
    }
  }

  // --- Handlers ---
  const handleInputChange = (delegate: 'delegate1' | 'delegate2', field: string, value: string) => {
    setDelegateInfo(prev => ({
      ...prev, 
      [delegate]: { 
        ...(prev[delegate] || {
          name: '', 
          email: '', 
          phone: '', 
          institution: EDUCATIONAL_INSTITUTIONS[0], 
          year: ACADEMIC_YEARS[0], 
          course: COURSES[0], 
          experience: ''
        }), 
        [field]: value 
      }
    }))
  }

  const validateStep = () => {
    const d1 = delegateInfo.delegate1
    const baseValid = d1.name && d1.email && d1.phone && 
                     d1.institution !== EDUCATIONAL_INSTITUTIONS[0] && 
                     d1.year !== ACADEMIC_YEARS[0] && 
                     d1.course !== COURSES[0] && 
                     d1.experience
    
    let d2Valid = true
    if (isDoubleDel) {
      const d2 = delegateInfo.delegate2
      d2Valid = !!(d2 && d2.name && d2.email && d2.phone && 
                  d2.institution !== EDUCATIONAL_INSTITUTIONS[0] && 
                  d2.year !== ACADEMIC_YEARS[0] && 
                  d2.course !== COURSES[0] && 
                  d2.experience)
    }

    const checkBlacklist = (info: DelegateData) => {
      const entry = BLACKLIST.find(e => e.email.toLowerCase() === info.email.toLowerCase() || e.phone === info.phone)
      if (entry) { setError(`SECURITY CLEARANCE DENIED: ${entry.reason}`); return true }
      return false
    }

    if (!baseValid || (isDoubleDel && !d2Valid)) {
      setError('Please fill all required fields correctly')
      return false
    }

    if (checkBlacklist(delegateInfo.delegate1) || (isDoubleDel && delegateInfo.delegate2 && checkBlacklist(delegateInfo.delegate2))) return false
    
    setError('')
    return true
  }

  const applyCoupon = () => {
    const code = couponCode.toUpperCase().trim()
    if (!code) {
      setCouponError('Please enter a coupon code')
      return
    }
    
    if (VALID_COUPONS[code]) {
      setDiscount(VALID_COUPONS[code])
      setCouponApplied(true)
      setCouponError('')
    } else {
      setCouponError('Invalid coupon code. Please check and try again.')
      setDiscount(0)
      setCouponApplied(false)
    }
  }

  const calculatePrice = () => {
    if (!currentPhase) return 0
    const base = selectedCommittee?.isOnline ? 49 : (isDoubleDel ? currentPhase.doublePrice : currentPhase.singlePrice)
    return Math.max(0, base - discount)
  }

  const getAverageExperience = () => {
    const exp1 = parseInt(delegateInfo.delegate1.experience.split('-')[0]) || 0
    if (!isDoubleDel || !delegateInfo.delegate2) return exp1
    const exp2 = parseInt(delegateInfo.delegate2.experience.split('-')[0]) || 0
    return Math.round((exp1 + exp2) / 2)
  }

  const initiateAccreditation = async () => {
    if (!validateStep()) return
    
    // Check if user is logged in with Google
    if (!user) {
      setError('Please sign in with Google to continue registration')
      return
    }
    
    // Verify that the email matches Google account
    if (delegateInfo.delegate1.email !== user.email) {
      setError('Please use the same email address as your Google account for registration')
      return
    }
    
    if (whatsappRegistration) {
        const d1 = delegateInfo.delegate1
        const d2 = delegateInfo.delegate2
        let msg = `*KIMUN ACCREDITATION REQUEST*%0A%0A*Committee:* ${selectedCommittee?.name}%0A*Portfolio:* ${selectedPortfolio?.country}%0A*Type:* ${isDoubleDel ? 'Double' : 'Single'}%0A*Fee:* ₹${calculatePrice()}%0A%0A*Delegate 1:* ${d1.name}%0A*Email:* ${d1.email}%0A*Phone:* ${d1.phone}%0A*Institution:* ${d1.institution}%0A*Year:* ${d1.year}%0A*Course:* ${d1.course}%0A*Experience:* ${d1.experience}%0A`
        if (isDoubleDel && d2) {
          msg += `%0A*Delegate 2:* ${d2.name}%0A*Email:* ${d2.email}%0A*Phone:* ${d2.phone}%0A*Institution:* ${d2.institution}%0A*Year:* ${d2.year}%0A*Course:* ${d2.course}%0A*Experience:* ${d2.experience}%0A`
        }
        msg += `%0APlease verify credentials and provide Plenary Session access.`
        window.open(`https://wa.me/918249979557?text=${msg}`, '_blank')
    } else {
        setError("Secure Payment Gateway undergoing maintenance. Please use WhatsApp Protocol.")
    }
  }

  const filteredPortfolios = selectedCommittee?.portfolios.filter(p => 
    p.isVacant && 
    (isDoubleDel ? p.isDoubleDelAllowed : true) && 
    getAverageExperience() >= p.minExperience &&
    (searchTerm === '' || 
     p.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.countryCode.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center font-sans">
      <Loader2 className="animate-spin text-[#009EDB] mb-4" size={48} strokeWidth={3} />
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Loading registration form...</span>
    </div>
  )

  if (!registrationOpen) return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-xl bg-white p-12 border-t-8 border-[#4D4D4D] shadow-2xl rounded-sm">
        <Lock className="w-20 h-20 text-gray-300 mx-auto mb-8" />
        <h1 className="text-2xl font-black text-[#333333] mb-4 uppercase tracking-tighter">Registration Closed</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">The registration gateway for the current session is offline. Please check back later for the next registration window.</p>
        <div className="space-y-3">
            {ACCREDITATION_PHASES.map((p, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-bold p-3 bg-gray-50 border border-gray-100 uppercase tracking-widest">
                    <span className="text-gray-400">{p.name}</span>
                    <span className="text-gray-300">Closed</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans selection:bg-[#009EDB]/20">
      
      {/* 1. INSTITUTIONAL HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-[100] shadow-sm">
        <div className="bg-[#4D4D4D] text-white py-1 px-8 text-[9px] uppercase font-black tracking-widest flex justify-between items-center">
            <span>KIMUN 2026 - Delegate Registration Portal</span>
            <span>Ref: KIMUN/ACC/GATEWAY</span>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Emblem" className="h-14 w-14" />
            <div className="border-l-2 border-gray-100 pl-6">
               <h1 className="text-lg font-black text-[#003366] leading-none uppercase tracking-tighter">Delegate Registration</h1>
               <p className="text-[10px] font-black text-[#009EDB] uppercase tracking-[0.2em] mt-1">Kalinga International MUN 2026</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-10">
              {[1,2,3,4,5].map(i => (
                  <ProgressStep 
                      key={i} 
                      current={step} 
                      step={i} 
                      label={["Type", "Details", "Committee", "Country", "Payment"][i-1]} 
                      icon={[Settings, Users, Landmark, Globe, ShieldCheck][i-1]}
                  />
              ))}
            </div>
            
            {/* Auth Button */}
            <div className="ml-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#009EDB] rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#003366] leading-tight">{user.displayName || 'User'}</p>
                      <p className="text-[10px] text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleLogout}
                    className="border-[#009EDB] text-[#009EDB] hover:bg-[#F0F8FF]"
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="google" 
                  onClick={signInWithGoogle}
                  disabled={authLoading}
                  className="flex items-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-16">
        {/* Google Sign-In Warning */}
        {!user && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-sm"
          >
            <div className="flex items-start">
              <Info className="text-yellow-600 mr-3 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-bold text-yellow-800">Google Sign-In Required</h3>
                <p className="text-xs text-yellow-700 mt-1">
                  Please sign in with Google to continue registration. This ensures secure access to your delegate dashboard after registration.
                </p>
                <Button 
                  variant="google" 
                  onClick={signInWithGoogle}
                  disabled={authLoading}
                  className="mt-3 text-sm"
                >
                  {authLoading ? 'Signing in...' : 'Sign in with Google to Continue'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-gray-200 shadow-xl rounded-sm p-6 md:p-10 lg:p-16 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#009EDB]" />

            {/* STEP 1: DELEGATION TYPE */}
            {step === 1 && (
              <div className="space-y-8">
                <div>
                   <h2 className="text-2xl md:text-3xl font-black text-[#003366] uppercase tracking-tighter mb-2">Registration Type</h2>
                   <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Choose your participation type</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { val: false, title: "Single Delegate", desc: "Register as an individual delegate" },
                    { val: true, title: "Double Delegate", desc: "Register with a partner (2 delegates together)" }
                  ].map((opt, i) => (
                    <div 
                      key={i}
                      onClick={() => setIsDoubleDel(opt.val)}
                      className={`p-6 md:p-8 border-2 cursor-pointer transition-all rounded-sm ${isDoubleDel === opt.val ? 'border-[#009EDB] bg-[#F0F8FF]' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDoubleDel === opt.val ? 'bg-[#009EDB] text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {opt.val ? <Users size={20} /> : <UserCheck size={20} />}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isDoubleDel === opt.val ? 'border-[#009EDB]' : 'border-gray-200'}`}>
                           {isDoubleDel === opt.val && <div className="w-2 h-2 bg-[#009EDB] rounded-full" />}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-[#003366] uppercase">{opt.title}</h3>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">{opt.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 p-6 flex items-center gap-4 border border-blue-100 rounded-sm">
                    <Info className="text-[#009EDB]" size={20} />
                    <div>
                        <p className="text-xs font-black uppercase text-[#009EDB] tracking-widest">Current Pricing</p>
                        <p className="text-sm font-bold text-[#003366]">
                          {currentPhase?.name} Phase: ₹{currentPhase?.singlePrice} (Single) / ₹{currentPhase?.doublePrice} (Double)
                        </p>
                    </div>
                </div>

                <Button 
                  onClick={() => {
                    if (!user) {
                      setError('Please sign in with Google first')
                    } else {
                      setStep(2)
                    }
                  }} 
                  className="w-full h-14 text-base"
                  disabled={!user}
                >
                  {user ? 'Next: Fill Details' : 'Please Sign In First'} <ChevronRight className="ml-3" />
                </Button>
              </div>
            )}

            {/* STEP 2: DELEGATE DETAILS */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="flex justify-between items-end border-b-2 border-gray-50 pb-4">
                   <h2 className="text-2xl md:text-3xl font-black text-[#003366] uppercase tracking-tighter leading-none">Delegate Details</h2>
                   <div className="flex items-center gap-2">
                     {user && (
                       <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-sm border border-green-200">
                         <CheckCircle className="h-4 w-4 text-green-600" />
                         <span className="text-xs font-bold text-green-700">Signed in</span>
                       </div>
                     )}
                     <div className="bg-[#003366] text-white px-3 py-1 text-xs font-black uppercase tracking-widest">Required</div>
                   </div>
                </div>

                <div className="space-y-8">
                   <DelegateForm 
                      delegate="delegate1"
                      title="Primary Delegate" 
                      data={delegateInfo.delegate1} 
                      onChange={(f: string, v: string) => handleInputChange('delegate1', f, v)}
                      userEmail={user?.email || ''}
                   />
                   {isDoubleDel && (
                     <DelegateForm 
                      delegate="delegate2"
                      title="Secondary Delegate" 
                      data={delegateInfo.delegate2 || {
                        name: '', 
                        email: '', 
                        phone: '', 
                        institution: EDUCATIONAL_INSTITUTIONS[0], 
                        year: ACADEMIC_YEARS[0], 
                        course: COURSES[0], 
                        experience: ''
                      }} 
                      onChange={(f: string, v: string) => handleInputChange('delegate2', f, v)} 
                     />
                   )}
                </div>

                <div className="flex gap-4 md:gap-6 flex-col md:flex-row">
                   <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                   <Button onClick={() => {
                     if (validateStep()) {
                       setStep(3)
                     }
                   }} className="flex-2">Next: Select Committee <ChevronRight className="ml-3" /></Button>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-sm">
                    <p className="text-red-600 text-sm font-medium flex items-center">
                      <AlertCircle className="inline mr-2" size={16} /> {error}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: COMMITTEE SELECTION */}
            {step === 3 && (
              <div className="space-y-8">
                <h2 className="text-2xl md:text-3xl font-black text-[#003366] uppercase tracking-tighter">Select Committee</h2>
                <div className="grid gap-4">
                   {committees.map((c) => (
                      <div 
                        key={c.id} 
                        onClick={() => {
                          setSelectedCommittee(c);
                          if(c.isOnline) setIsDoubleDel(false);
                          setSelectedPortfolio(null);
                        }}
                        className={`p-4 md:p-6 border-2 flex items-center gap-4 md:gap-6 cursor-pointer transition-all rounded-sm ${selectedCommittee?.id === c.id ? 'border-[#009EDB] bg-[#F0F8FF]' : 'border-gray-50 hover:border-gray-200'}`}
                      >
                         <div className="text-2xl md:text-3xl">{c.emoji}</div>
                         <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:justify-between gap-2">
                               <h4 className="font-bold text-[#003366] uppercase tracking-tight">{c.name}</h4>
                               {c.isOnline && (
                                 <span className="bg-blue-600 text-white text-xs font-black px-2 py-0.5 uppercase tracking-widest self-start">
                                   Online Only
                                 </span>
                               )}
                            </div>
                            <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">
                              {c.portfolios.filter(p => p.isVacant).length} Countries Available
                            </p>
                         </div>
                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedCommittee?.id === c.id ? 'border-[#009EDB]' : 'border-gray-200'}`}>
                           {selectedCommittee?.id === c.id && <div className="w-2 h-2 bg-[#009EDB] rounded-full" />}
                         </div>
                      </div>
                   ))}
                </div>
                <div className="flex gap-4 md:gap-6 flex-col md:flex-row">
                   <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                   <Button 
                     onClick={() => {
                       if (selectedCommittee) {
                         setStep(4)
                       } else {
                         setError('Please select a committee')
                       }
                     }} 
                     className="flex-2"
                   >
                     Next: Choose Country <ChevronRight className="ml-3" />
                   </Button>
                </div>
              </div>
            )}

            {/* STEP 4: COUNTRY SELECTION */}
            {step === 4 && (
              <div className="space-y-8">
                <h2 className="text-2xl md:text-3xl font-black text-[#003366] uppercase tracking-tighter">
                  Choose Your Country - {selectedCommittee?.name}
                </h2>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search countries..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:border-[#009EDB] text-gray-900 placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {filteredPortfolios && filteredPortfolios.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2">
                    {filteredPortfolios.map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedPortfolio(p)}
                        className={`p-4 border-2 flex flex-col items-center text-center gap-3 cursor-pointer transition-all relative rounded-sm hover:shadow-md ${
                          selectedPortfolio?.id === p.id 
                            ? 'border-[#009EDB] bg-[#F0F8FF]' 
                            : 'border-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <DiplomaticFlag 
                          countryCode={p.countryCode} 
                          className="w-16 h-10 shadow-sm border border-gray-100 object-cover" 
                        />
                        <div>
                          <span className="text-sm font-bold text-[#003366] uppercase leading-tight block">
                            {p.country}
                          </span>
                          <span className="text-xs text-gray-500 mt-1 block">
                            Min. {p.minExperience} MUN experience
                          </span>
                        </div>
                        {selectedPortfolio?.id === p.id && (
                          <CheckCircle className="text-[#009EDB] absolute top-2 right-2" size={20} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Globe2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No available countries match your search or experience level.</p>
                    <p className="text-gray-400 text-sm mt-2">Try a different search or check other committees.</p>
                  </div>
                )}

                <div className="flex gap-4 md:gap-6 flex-col md:flex-row">
                   <Button variant="outline" onClick={() => {
                     setSelectedPortfolio(null);
                     setSearchTerm('');
                     setStep(3);
                   }} className="flex-1">Back</Button>
                   <Button 
                     onClick={() => {
                       if (selectedPortfolio) {
                         setStep(5)
                       } else {
                         setError('Please select a country')
                       }
                     }} 
                     className="flex-2"
                   >
                     Review & Payment <ChevronRight className="ml-3" />
                   </Button>
                </div>
              </div>
            )}

            {/* STEP 5: PAYMENT & REVIEW */}
            {step === 5 && (
              <div className="space-y-8">
                <div className="bg-[#003366] text-white p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 rounded-sm">
                   <div className="space-y-2">
                      <p className="text-xs font-black uppercase tracking-widest opacity-80">Registration Fee</p>
                      <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase">₹{calculatePrice()}</h3>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#009EDB]">
                        {currentPhase?.name} Phase
                      </p>
                   </div>
                   
                   <div className="flex flex-col gap-3 w-full md:w-auto">
                     <div className="flex gap-2">
                       <input 
                         placeholder="Enter coupon code" 
                         className="bg-white text-gray-900 text-sm px-4 py-3 rounded-sm flex-1 focus:outline-none border border-gray-300"
                         value={couponCode} 
                         onChange={(e) => setCouponCode(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                       />
                       <Button size="default" onClick={applyCoupon} variant="outline" className="border-white text-white hover:bg-white/10">
                         Apply
                       </Button>
                     </div>
                     {couponApplied && (
                       <p className="text-green-300 text-sm font-medium text-center">
                         ✓ Coupon applied! Discount: ₹{discount}
                       </p>
                     )}
                     {couponError && (
                       <p className="text-red-300 text-sm font-medium text-center">
                         {couponError}
                       </p>
                     )}
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <h4 className="text-sm font-black uppercase text-[#009EDB] tracking-widest border-b border-gray-100 pb-2">
                        Your Selection
                      </h4>
                      <div className="space-y-4">
                         <div className="flex items-center gap-4">
                            <Landmark size={24} className="text-gray-300" />
                            <div>
                               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Committee</p>
                               <p className="text-base font-bold text-[#003366]">{selectedCommittee?.name}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <Globe size={24} className="text-gray-300" />
                            <div>
                               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Country</p>
                               <div className="flex items-center gap-2">
                                  {selectedPortfolio && (
                                    <DiplomaticFlag countryCode={selectedPortfolio.countryCode} className="w-8 h-6" />
                                  )}
                                  <p className="text-base font-bold text-[#003366]">{selectedPortfolio?.country}</p>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <Users size={24} className="text-gray-300" />
                            <div>
                               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Registration Type</p>
                               <p className="text-base font-bold text-[#003366]">
                                 {isDoubleDel ? 'Double Delegate (2 people)' : 'Single Delegate'}
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="text-sm font-black uppercase text-[#009EDB] tracking-widest border-b border-gray-100 pb-2">
                        Payment Method
                      </h4>
                      <div className="p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-sm">
                         <label className="flex items-center gap-4 cursor-pointer mb-4">
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${whatsappRegistration ? 'bg-green-500' : 'bg-gray-300'}`}>
                               <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${whatsappRegistration ? 'translate-x-6' : ''}`} />
                               <input 
                                 type="checkbox" 
                                 className="sr-only" 
                                 checked={whatsappRegistration} 
                                 onChange={() => setWhatsappRegistration(!whatsappRegistration)} 
                               />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-[#333]">Complete via WhatsApp</span>
                              <p className="text-xs text-gray-500 mt-1">Recommended - Fastest confirmation</p>
                            </div>
                         </label>
                         <div className="bg-white p-4 rounded-sm border border-gray-200">
                           <p className="text-xs text-gray-600">
                             You'll be redirected to WhatsApp where our team will guide you through payment and confirmation.
                           </p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-black uppercase text-[#009EDB] tracking-widest mb-4">Delegate Information</h4>
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                    <p className="text-sm font-bold text-[#003366] mb-2">Primary Delegate: {delegateInfo.delegate1.name}</p>
                    <p className="text-xs text-gray-600 mb-3">{delegateInfo.delegate1.institution} • {delegateInfo.delegate1.year}</p>
                    {isDoubleDel && delegateInfo.delegate2 && (
                      <>
                        <p className="text-sm font-bold text-[#003366] mb-2">Secondary Delegate: {delegateInfo.delegate2.name}</p>
                        <p className="text-xs text-gray-600">{delegateInfo.delegate2.institution} • {delegateInfo.delegate2.year}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 md:gap-6 flex-col md:flex-row pt-6 border-t border-gray-100">
                   <Button variant="outline" onClick={() => setStep(4)} className="flex-1">Back</Button>
                   <Button 
                     onClick={initiateAccreditation} 
                     className="flex-2 bg-green-600 hover:bg-green-700 h-14"
                     disabled={!user}
                   >
                      {user ? 'Complete Registration' : 'Please Sign In First'} <ArrowRight className="ml-3" />
                   </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-4 md:px-8 py-8 border-t border-gray-100 text-center">
         <p className="text-xs font-medium text-gray-400">
           Kalinga International MUN Secretariat • Official Registration System
         </p>
         <p className="text-xs text-gray-500 mt-2">
           For assistance, contact: +91 82499 79557 • info@kimun.org
         </p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { background-color: #F9FAFB; font-family: 'Inter', sans-serif; }
        * { -webkit-font-smoothing: antialiased; }
        input, select, textarea {
          color: #1f2937 !important; /* gray-900 - black text */
        }
        input::placeholder {
          color: #9ca3af !important; /* gray-400 */
        }
        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1em;
          padding-right: 2.5rem !important;
        }
      `}</style>
    </div>
  )
}

function DelegateForm({ title, data, onChange, delegate, userEmail }: any) {
  const isPrimaryDelegate = delegate === 'delegate1'
  
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-black uppercase text-[#009EDB] tracking-widest border-l-4 border-[#009EDB] pl-3">
        {title}
        {isPrimaryDelegate && userEmail && (
          <span className="ml-3 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
            ✓ Signed in as {userEmail}
          </span>
        )}
      </h3>
      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Full Name *</label>
          <input 
            className="w-full bg-gray-50 border border-gray-200 py-3 px-4 text-sm focus:border-[#009EDB] focus:outline-none transition-colors rounded-sm text-gray-900"
            placeholder="Enter your full name"
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Email *</label>
          <input 
            type="email"
            className={`w-full bg-gray-50 border border-gray-200 py-3 px-4 text-sm focus:border-[#009EDB] focus:outline-none transition-colors rounded-sm text-gray-900 ${isPrimaryDelegate && userEmail ? 'bg-green-50 border-green-200' : ''}`}
            placeholder="example@email.com"
            value={isPrimaryDelegate && userEmail ? userEmail : data.email}
            onChange={(e) => onChange('email', e.target.value)}
            readOnly={isPrimaryDelegate && !!userEmail}
          />
          {isPrimaryDelegate && userEmail && (
            <p className="text-xs text-green-600 mt-1">Using your Google account email</p>
          )}
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Phone Number *</label>
          <input 
            type="tel"
            className="w-full bg-gray-50 border border-gray-200 py-3 px-4 text-sm focus:border-[#009EDB] focus:outline-none transition-colors rounded-sm text-gray-900"
            placeholder="+91 00000 00000"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Institution *</label>
          <select
            className="w-full bg-gray-50 border border-gray-200 py-3 px-4 text-sm focus:border-[#009EDB] focus:outline-none transition-colors rounded-sm text-gray-900"
            value={data.institution}
            onChange={(e) => onChange('institution', e.target.value)}
          >
            {EDUCATIONAL_INSTITUTIONS.map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Year of Study *</label>
          <select
            className="w-full bg-gray-50 border border-gray-200 py-3 px-4 text-sm focus:border-[#009EDB] focus:outline-none transition-colors rounded-sm text-gray-900"
            value={data.year}
            onChange={(e) => onChange('year', e.target.value)}
          >
            {ACADEMIC_YEARS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Course *</label>
          <select
            className="w-full bg-gray-50 border border-gray-200 py-3 px-4 text-sm focus:border-[#009EDB] focus:outline-none transition-colors rounded-sm text-gray-900"
            value={data.course}
            onChange={(e) => onChange('course', e.target.value)}
          >
            {COURSES.map((course) => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>
        
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">MUN Experience *</label>
          <select
            className="w-full bg-gray-50 border border-gray-200 py-3 px-4 text-sm focus:border-[#009EDB] focus:outline-none transition-colors rounded-sm text-gray-900"
            value={data.experience}
            onChange={(e) => onChange('experience', e.target.value)}
          >
            <option value="">Select your experience level</option>
            {EXPERIENCE_LEVELS.map((exp) => (
              <option key={exp.value} value={exp.value}>{exp.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

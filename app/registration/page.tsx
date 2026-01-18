"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, CheckCircle, Globe, Users, Settings, AlertCircle, 
  ChevronRight, Calendar, Clock, Lock, Unlock, FileText, 
  ShieldCheck, Landmark, Search, ArrowLeft, ArrowRight,
  UserCheck, ClipboardList, CreditCard, MessageSquare, Loader2,
  Scale, Gavel, Globe2, Info, Award, ChevronDown, Mail, LogOut,
  Fingerprint
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
  "KIMUN2025WINWAR": 999,
};

// --- Educational Institutions ---
const EDUCATIONAL_INSTITUTIONS = [
  "Select Your Institution",
  "Kalinga Institute of Industrial Technology (KIIT)",
  "Kalinga Institute of Social Sciences (KISS)",
  "Ravenshaw University",
  "Buxi Jagabandhu Bidyadhar College (BJB)",
  "Sri Aurobindo Institute of Higher Education (SAIHE)",
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
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [delegateInfo, setDelegateInfo] = useState<DelegateInfo>({
    delegate1: { name: '', email: '', phone: '', institution: EDUCATIONAL_INSTITUTIONS[0], year: ACADEMIC_YEARS[0], course: COURSES[0], experience: '' }
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
  
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  const app = initializeApp(firebaseConfig)
  const db = getDatabase(app)
  const auth = getAuth(app)
  const googleProvider = new GoogleAuthProvider()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
        if (!delegateInfo.delegate1.email) {
          handleInputChange('delegate1', 'email', user.email || '')
          handleInputChange('delegate1', 'name', user.displayName || '')
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

  const signInWithGoogle = async () => {
    try {
      setAuthLoading(true)
      setError('')
      const result = await signInWithPopup(auth, googleProvider)
      setUser(result.user)
      handleInputChange('delegate1', 'email', result.user.email || '')
      handleInputChange('delegate1', 'name', result.user.displayName || '')
    } catch (error: any) {
      setError('Identity Sync Protocol Failed.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    setUser(null)
    setStep(1)
  }

  const handleInputChange = (delegate: 'delegate1' | 'delegate2', field: string, value: string) => {
    setDelegateInfo(prev => ({
      ...prev, 
      [delegate]: { 
        ...(prev[delegate] || { name: '', email: '', phone: '', institution: EDUCATIONAL_INSTITUTIONS[0], year: ACADEMIC_YEARS[0], course: COURSES[0], experience: '' }), 
        [field]: value 
      }
    }))
  }

  const validateStep = () => {
    const d1 = delegateInfo.delegate1
    const baseValid = d1.name && d1.email && d1.phone && d1.institution !== EDUCATIONAL_INSTITUTIONS[0] && d1.year !== ACADEMIC_YEARS[0] && d1.course !== COURSES[0] && d1.experience
    
    let d2Valid = true
    if (isDoubleDel) {
      const d2 = delegateInfo.delegate2
      d2Valid = !!(d2 && d2.name && d2.email && d2.phone && d2.institution !== EDUCATIONAL_INSTITUTIONS[0] && d2.year !== ACADEMIC_YEARS[0] && d2.course !== COURSES[0] && d2.experience)
    }

    const checkBlacklist = (info: DelegateData) => {
      const entry = BLACKLIST.find(e => e.email.toLowerCase() === info.email.toLowerCase() || e.phone === info.phone)
      if (entry) { setError(`SECURITY CLEARANCE DENIED: ${entry.reason}`); return true }
      return false
    }

    if (!baseValid || (isDoubleDel && !d2Valid)) {
      setError('Institutional Protocol: Verify all required data fields.')
      return false
    }

    if (checkBlacklist(delegateInfo.delegate1) || (isDoubleDel && delegateInfo.delegate2 && checkBlacklist(delegateInfo.delegate2))) return false
    
    setError('')
    return true
  }

  const applyCoupon = () => {
    const code = couponCode.toUpperCase().trim()
    if (!code) { setCouponError('Protocol code required'); return }
    if (VALID_COUPONS[code]) {
      setDiscount(VALID_COUPONS[code]); setCouponApplied(true); setCouponError('')
    } else {
      setCouponError('Invalid Credential Code'); setDiscount(0); setCouponApplied(false)
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

  const saveToDatabase = async () => {
    if (!selectedCommittee || !selectedPortfolio || !user) return null;
    
    const regRef = ref(db, 'registrations');
    const registrationPayload = {
      delegateInfo,
      committeeId: selectedCommittee.id,
      committeeName: selectedCommittee.name,
      portfolioId: selectedPortfolio.id,
      portfolioName: selectedPortfolio.country,
      isDoubleDel,
      timestamp: Date.now(),
      status: 'AWAITING_VERIFICATION',
      verifiedIdentity: {
        uid: user.uid,
        email: user.email,
        provider: 'google.com'
      },
      financials: {
        phase: currentPhase?.name,
        baseAmount: selectedCommittee.isOnline ? 49 : (isDoubleDel ? currentPhase.doublePrice : currentPhase.singlePrice),
        discount: discount,
        totalPaid: calculatePrice(),
        couponUsed: couponApplied ? couponCode : null
      },
      method: whatsappRegistration ? 'WHATSAPP_PROTOCOL' : 'ONLINE_GATEWAY'
    };

    try {
      // 1. Push Registration
      const newReg = await push(regRef, registrationPayload);
      
      // 2. Mark Portfolio as Occupied
      const portfolioPath = `committees/${selectedCommittee.id}/portfolios/${selectedPortfolio.id}`;
      await update(ref(db, portfolioPath), { isVacant: false });
      
      return newReg.key;
    } catch (err) {
      console.error("Database Protocol Breach:", err);
      throw new Error("Registry Synchronization Failed.");
    }
  }

  const initiateAccreditation = async () => {
    if (!validateStep()) return
    if (!user) { setError('Identity Sync required for Plenary access.'); return }
    if (delegateInfo.delegate1.email !== user.email) { setError('Verification Error: Google Identity must match Delegate 1 email.'); return }
    
    setProcessing(true);
    try {
      const regId = await saveToDatabase();
      
      if (whatsappRegistration) {
          const d1 = delegateInfo.delegate1; const d2 = delegateInfo.delegate2;
          let msg = `*KIMUN ACCREDITATION REQUEST*%0A%0A*Registry ID:* ${regId}%0A*Committee:* ${selectedCommittee?.name}%0A*Portfolio:* ${selectedPortfolio?.country}%0A*Total Fee:* ₹${calculatePrice()}%0A%0A*Delegate 1:* ${d1.name}%0A*Institution:* ${d1.institution}%0A`
          if (isDoubleDel && d2) msg += `*Delegate 2:* ${d2.name}%0A`
          msg += `%0APlease finalize diplomatic clearance for Plenary Session 2026.`;
          window.open(`https://wa.me/918249979557?text=${msg}`, '_blank')
      }

      // --- DIPLOMATIC REDIRECT ---
      // Teleporting representive to the Delegate Portal
      window.location.href = '/delegate';

    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  const filteredPortfolios = selectedCommittee?.portfolios.filter(p => 
    p.isVacant && (isDoubleDel ? p.isDoubleDelAllowed : true) && getAverageExperience() >= p.minExperience &&
    (searchTerm === '' || p.country.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center font-sans">
      <Loader2 className="animate-spin text-[#009EDB] mb-4" size={48} strokeWidth={3} />
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Querying Secretariat Database...</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans selection:bg-[#009EDB]/20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-[100] shadow-sm">
        <div className="bg-[#4D4D4D] text-white py-1.5 px-8 text-[9px] uppercase font-black tracking-widest flex justify-between items-center">
            <div className="flex items-center gap-4">
               {user ? (
                 <span className="flex items-center gap-2 text-[#009EDB]"><UserCheck size={10} /> Identity Synced: {user.email}</span>
               ) : (
                 <span className="flex items-center gap-2 opacity-50"><Lock size={10} /> Secure Session Required</span>
               )}
            </div>
            <span>Ref: KIMUN/ACC/2026/G-1</span>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Emblem" className="h-14 w-14" />
            <div className="border-l-2 border-gray-100 pl-6">
               <h1 className="text-lg font-black text-[#003366] leading-none uppercase tracking-tighter">Accreditation Service</h1>
               <p className="text-[10px] font-black text-[#009EDB] uppercase tracking-[0.2em] mt-1">Kalinga International MUN 2026</p>
            </div>
          </div>
          <div className="hidden md:flex gap-10">
             {[1,2,3,4,5].map(i => (
                <ProgressStep key={i} current={step} step={i} label={["Profile", "Dossier", "Organ", "Mission", "Verify"][i-1]} icon={[Settings, Users, Landmark, Globe, ShieldCheck][i-1]} />
             ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {!user && step === 1 && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-blue-50 border-l-4 border-[#009EDB] p-6 rounded-r-sm shadow-sm">
                <div className="flex items-start gap-4">
                    <Fingerprint className="text-[#003366] mt-1" size={24} />
                    <div>
                        <h3 className="text-sm font-black text-[#003366] uppercase tracking-wider">Identity Sync Protocol</h3>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">Access to Plenary Dossiers requires high-fidelity identity verification. Sync with your Google account to secure your Member State allocation and Delegate Vault.</p>
                        <Button variant="google" onClick={signInWithGoogle} disabled={authLoading} className="mt-4 h-10 px-6">
                            {authLoading ? <Loader2 className="animate-spin mr-2" size={14} /> : <Mail className="mr-2" size={14} />} 
                            Connect Google Identity
                        </Button>
                    </div>
                </div>
            </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white border border-gray-200 shadow-xl rounded-sm p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#009EDB]" />

            {step === 1 && (
              <div className="space-y-10">
                <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter">Participation Profile</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {[{ val: false, title: "Single Delegate", icon: UserCheck }, { val: true, title: "Double Delegate", icon: Users }].map((opt, i) => (
                    <div key={i} onClick={() => setIsDoubleDel(opt.val)} className={`p-8 border-2 cursor-pointer transition-all ${isDoubleDel === opt.val ? 'border-[#009EDB] bg-[#F0F8FF]' : 'border-gray-100 hover:border-gray-300'}`}>
                      <opt.icon size={32} className={`mb-4 ${isDoubleDel === opt.val ? 'text-[#009EDB]' : 'text-gray-300'}`} />
                      <h3 className="text-lg font-bold text-[#003366] uppercase">{opt.title}</h3>
                      <div className="mt-4 flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isDoubleDel === opt.val ? 'border-[#009EDB]' : 'border-gray-200'}`}>
                              {isDoubleDel === opt.val && <div className="w-2 h-2 bg-[#009EDB] rounded-full" />}
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Protocol</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={() => user ? setStep(2) : setError('Identity Sync Required.')} className="w-full h-16 text-lg">Next: Create Dossier <ChevronRight className="ml-3" /></Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-12">
                <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter border-b-2 border-gray-50 pb-6">Delegate Dossier</h2>
                <DelegateForm title="Primary Representative" data={delegateInfo.delegate1} userEmail={user?.email} onChange={(f: string, v: string) => handleInputChange('delegate1', f, v)} delegate="delegate1" />
                {isDoubleDel && <DelegateForm title="Secondary Representative" data={delegateInfo.delegate2 || {} as DelegateData} onChange={(f: string, v: string) => handleInputChange('delegate2', f, v)} delegate="delegate2" />}
                <div className="flex gap-6">
                   <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                   <Button onClick={() => validateStep() ? setStep(3) : null} className="flex-[2]">Confirm Credentials <ChevronRight className="ml-3" /></Button>
                </div>
                {error && <p className="text-red-600 text-[10px] font-black uppercase text-center mt-4 tracking-widest animate-pulse">{error}</p>}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10">
                <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter">Organ Selection</h2>
                <div className="grid gap-4">
                   {committees.map((c, i) => (
                      <div key={c.id} onClick={() => { setSelectedCommittee(c); if(c.isOnline) setIsDoubleDel(false); setSelectedPortfolio(null); }} className={`p-6 border-2 flex items-center gap-6 cursor-pointer transition-all ${selectedCommittee?.id === c.id ? 'border-[#009EDB] bg-[#F0F8FF]' : 'border-gray-50 hover:border-gray-200'}`}>
                         <div className="text-3xl">{c.emoji}</div>
                         <div className="flex-1">
                            <h4 className="font-bold text-[#003366] uppercase tracking-tight">{c.name}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">KIMUN/C-{i+1} • {c.portfolios.filter(p => p.isVacant).length} Seats Available</p>
                         </div>
                         {selectedCommittee?.id === c.id && <CheckCircle className="text-[#009EDB]" size={20} />}
                      </div>
                   ))}
                </div>
                <div className="flex gap-6">
                   <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                   <Button onClick={() => selectedCommittee ? setStep(4) : setError('Select an Organ')} className="flex-[2]">Proceed to Mission <ChevronRight className="ml-3" /></Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-10">
                <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter">Member State Mission</h2>
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input type="text" placeholder="Search Member States..." className="w-full pl-12 pr-4 py-3 border-2 border-gray-100 focus:border-[#009EDB] focus:outline-none text-sm rounded-sm text-gray-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
                   {filteredPortfolios?.map(p => (
                      <div key={p.id} onClick={() => setSelectedPortfolio(p)} className={`p-5 border-2 flex flex-col items-center text-center gap-3 cursor-pointer transition-all relative ${selectedPortfolio?.id === p.id ? 'border-[#009EDB] bg-[#F0F8FF]' : 'border-gray-50 hover:border-gray-200'}`}>
                         <DiplomaticFlag countryCode={p.countryCode} className="w-12 h-8 border border-gray-100" />
                         <span className="text-[11px] font-bold text-[#003366] uppercase">{p.country}</span>
                         {selectedPortfolio?.id === p.id && <CheckCircle className="text-[#009EDB] absolute top-2 right-2" size={16} />}
                      </div>
                    ))}
                </div>
                <div className="flex gap-6">
                   <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
                   <Button onClick={() => selectedPortfolio ? setStep(5) : setError('Assign a Member State')} className="flex-[2]">Review Credentials <ChevronRight className="ml-3" /></Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-10">
                <div className="bg-[#003366] text-white p-10 flex flex-col md:flex-row justify-between items-center gap-8 rounded-sm shadow-inner">
                   <div className="space-y-2 text-center md:text-left">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Plenary Access Fee</p>
                      <h3 className="text-4xl font-black italic tracking-tighter uppercase">Total: ₹{calculatePrice()}</h3>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#009EDB]">Sync Authenticated: {user?.email}</p>
                   </div>
                   <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-sm w-full md:w-auto">
                      <input placeholder="PROTOCOL CODE" className="bg-transparent text-white text-[10px] font-black tracking-widest uppercase focus:outline-none flex-1 md:w-32" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                      <Button size="sm" onClick={applyCoupon} variant="outline" className="border-[#009EDB] text-[#009EDB]">Apply</Button>
                   </div>
                </div>

                <div className="p-8 bg-gray-50 border border-gray-200 rounded-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <CheckCircle className="text-emerald-500" size={24} />
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Sovereign Representation Assigned</p>
                            <p className="text-sm font-bold text-[#003366] uppercase">{selectedPortfolio?.country} in {selectedCommittee?.name}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-white border border-gray-100 rounded-sm shadow-sm">
                        <label className="flex items-center gap-4 cursor-pointer">
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${whatsappRegistration ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                               <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${whatsappRegistration ? 'translate-x-6' : ''}`} />
                               <input type="checkbox" className="sr-only" checked={whatsappRegistration} onChange={() => setWhatsappRegistration(!whatsappRegistration)} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-[#333] tracking-widest">Submit via WhatsApp Protocol</span>
                         </label>
                    </div>
                </div>

                <div className="flex gap-6">
                   <Button variant="outline" onClick={() => setStep(4)} className="flex-1">Back</Button>
                   <Button onClick={initiateAccreditation} disabled={processing} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 h-16">
                      {processing ? <Loader2 className="animate-spin mr-3" /> : null}
                      {processing ? 'Synchronizing Registry...' : 'Initialize Final Clearance'} <ArrowRight className="ml-3" />
                   </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-10 border-t border-gray-100 text-center">
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Kalinga International MUN Secretariat • Secured Information System</p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        body { background-color: #F9FAFB; font-family: 'Inter', sans-serif; }
        * { -webkit-font-smoothing: antialiased; }
        input, select { color: #111827 !important; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23d1d5db'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1.2rem; }
      `}</style>
    </div>
  )
}

function DelegateForm({ title, data, onChange, userEmail, delegate }: any) {
  const isPrimary = delegate === 'delegate1'
  return (
    <div className="space-y-8">
      <h3 className="text-[10px] font-black uppercase text-[#009EDB] tracking-[0.4em] border-l-4 border-[#009EDB] pl-4">{title}</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <FormInput label="Full Legal Name" icon={UserCheck} value={data.name} onChange={(v: string) => onChange('name', v)} />
        <div className="space-y-1">
           <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><FileText size={10} /> Diplomatic Email</label>
           <div className={`w-full bg-gray-50 border-b-2 border-gray-200 py-3 px-4 text-sm flex items-center gap-2 italic ${isPrimary && userEmail ? 'text-[#009EDB] bg-blue-50/50 border-[#009EDB]/20' : 'text-gray-400'}`}>
              <Lock size={12} /> {isPrimary && userEmail ? userEmail : data.email} {isPrimary && userEmail ? '(Sync Verified)' : ''}
           </div>
        </div>
        <FormInput label="Primary Liaison Number" icon={MessageSquare} value={data.phone} onChange={(v: string) => onChange('phone', v)} type="tel" />
        <FormSelect label="Academic Mission" icon={Landmark} value={data.institution} onChange={(v: string) => onChange('institution', v)} options={EDUCATIONAL_INSTITUTIONS} />
        <FormSelect label="Year of Study" icon={Calendar} value={data.year} onChange={(v: string) => onChange('year', v)} options={ACADEMIC_YEARS} />
        <FormSelect label="Degree Program" icon={ClipboardList} value={data.course} onChange={(v: string) => onChange('course', v)} options={COURSES} />
        <div className="md:col-span-2">
            <FormSelect label="Convenings (MUNs)" icon={Award} value={data.experience} onChange={(v: string) => onChange('experience', v)} options={EXPERIENCE_LEVELS.map(l => l.value)} labels={EXPERIENCE_LEVELS.map(l => l.label)} />
        </div>
      </div>
    </div>
  )
}

function FormInput({ label, icon: Icon, value, onChange, type = "text" }: any) {
    return (
        <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><Icon size={10} /> {label}</label>
            <input type={type} className="w-full bg-white border-b-2 border-gray-200 py-3 px-4 text-sm focus:border-[#009EDB] focus:outline-none transition-colors text-gray-900" placeholder={`Enter ${label}`} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    )
}

function FormSelect({ label, icon: Icon, value, onChange, options, labels }: any) {
    return (
        <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><Icon size={10} /> {label}</label>
            <select className="w-full bg-white border-b-2 border-gray-200 py-3 px-4 text-sm focus:border-[#009EDB] focus:outline-none transition-colors text-gray-900" value={value} onChange={(e) => onChange(e.target.value)}>
               {options.map((opt: string, i: number) => <option key={opt} value={opt}>{labels ? labels[i] : opt}</option>)}
            </select>
        </div>
    )
}

function CheckCircle2(props: any) {
  return <CheckCircle {...props} />
}

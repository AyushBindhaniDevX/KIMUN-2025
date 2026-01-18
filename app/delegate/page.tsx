'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get } from 'firebase/database'
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth'
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  FileText, 
  Award, 
  Download, 
  QrCode, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Copy, 
  Eye,
  LogOut,
  Globe,
  Landmark,
  ShieldCheck,
  Calendar,
  Clock,
  ExternalLink,
  Info,
  CheckCircle2,
  Users,
  Globe2
} from 'lucide-react'
import { Toaster, toast } from 'sonner'

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
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

// --- Types ---
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
  experience?: string
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
}

type Coupon = {
  id: string
  title: string
  description: string
  code: string
  partner: string
  logo: string
  expiry: string
  discount: string
  terms: string
}

// --- Institutional UI Components ---
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

// --- Placeholder for Certificate Generator (User provides implementation) ---
const generateCertificate = async (d: any, c: any, p: any, preview: boolean = false) => {
    return { imageDataUrl: "", save: (n: string) => {} };
};

function DelegateDashboardContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [delegate, setDelegate] = useState<DelegateData | null>(null)
  const [committee, setCommittee] = useState<CommitteeData | null>(null)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState({
    login: false,
    data: false,
    resources: false,
    coupons: false,
    certificate: false
  })
  const [error, setError] = useState({ login: null as string | null })
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        setLoggedIn(true)
        await fetchDelegateData(user.email!)
      } else {
        setUser(null)
        setLoggedIn(false)
        setDelegate(null)
        setCommittee(null)
        setPortfolio(null)
      }
    })
    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      setLoading(prev => ({ ...prev, login: true }))
      const result = await signInWithPopup(auth, googleProvider)
      setUser(result.user)
      setLoggedIn(true)
      toast.success('Identity Verified')
    } catch (error: any) {
      setError(prev => ({ ...prev, login: error.message }))
      toast.error('Authentication Protocol Failed')
    } finally {
      setLoading(prev => ({ ...prev, login: false }))
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    setLoggedIn(false)
    toast.info('Session Terminated')
  }

  const fetchDelegateData = async (email: string) => {
    try {
      setLoading(prev => ({ ...prev, data: true }))
      const snapshot = await get(ref(db, 'registrations'))
      if (!snapshot.exists()) throw new Error('Dossier Not Found')

      const registrations = snapshot.val()
      let foundDelegate = null

      for (const key in registrations) {
        const reg = registrations[key]
        if (reg.delegateInfo?.delegate1?.email === email || reg.delegateInfo?.delegate2?.email === email || reg.email === email) {
          foundDelegate = {
            id: key,
            ...(reg.delegateInfo?.delegate1 || reg),
            committeeId: reg.committeeId,
            portfolioId: reg.portfolioId,
            isCheckedIn: reg.isCheckedIn || false
          }
          break
        }
      }

      if (!foundDelegate) throw new Error('Registry Sync Error: Identity mismatch.')

      setDelegate(foundDelegate)
      fetchCommitteeData(foundDelegate.committeeId, foundDelegate.portfolioId)
      fetchMarksData(foundDelegate.committeeId, foundDelegate.portfolioId)
      fetchResources()
      fetchCoupons()
    } catch (error) {
      toast.error('Identity Verification Failed')
      handleLogout()
    } finally {
      setLoading(prev => ({ ...prev, data: false }))
    }
  }

  const fetchCommitteeData = async (committeeId: string, portfolioId: string) => {
    const snapshot = await get(ref(db, `committees/${committeeId}`))
    if (snapshot.exists()) {
      const data = snapshot.val()
      setCommittee(data)
      if (data.portfolios && portfolioId) setPortfolio(data.portfolios[portfolioId])
    }
  }

  const fetchMarksData = async (committeeId: string, portfolioId: string) => {
    const snapshot = await get(ref(db, `marksheets/${committeeId}/marks`))
    if (snapshot.exists()) {
      const marksData = snapshot.val()
      const dMarks = Object.values(marksData).find((m: any) => m.portfolioId === portfolioId) as Mark | undefined
      if (dMarks) setDelegate(prev => ({ ...prev!, marks: dMarks }))
    }
  }

  const fetchResources = async () => {
    const snapshot = await get(ref(db, 'resources'))
    if (snapshot.exists()) {
      const data = snapshot.val()
      setResources(Object.keys(data).map(k => ({ id: k, ...data[k] })))
    }
  }

  const fetchCoupons = async () => {
    const snapshot = await get(ref(db, 'coupons'))
    if (snapshot.exists()) {
      const data = snapshot.val()
      setCoupons(Object.keys(data).map(k => ({ id: k, ...data[k] })))
    }
  }

  const handleDownloadCertificate = async () => {
    if (!delegate || !committee) return
    toast.loading('Generating Official Citation...')
    // Implementation should be provided in CertificateGenerator.ts
  }

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-6 font-sans">
        <Toaster position="top-center" richColors />
        <div className="max-w-md w-full bg-white border border-gray-200 shadow-2xl rounded-sm p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#009EDB]" />
          <Landmark size={48} className="text-[#003366] mx-auto mb-8" />
          <h1 className="text-2xl font-black text-[#003366] uppercase tracking-tighter mb-4">Delegate Portal Access</h1>
          <p className="text-gray-500 text-sm mb-10 leading-relaxed font-light">
            Authenticate your identity via the **Unified Identity Service** to access your plenary dossier and resources.
          </p>
          <Button variant="google" onClick={signInWithGoogle} disabled={loading.login} className="w-full h-14">
            {loading.login ? <Loader2 className="animate-spin mr-2" size={16} /> : <UserIcon className="mr-2" size={16} />}
            Identity Sync via Google
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans selection:bg-[#009EDB]/20">
      <Toaster position="top-right" richColors />
      
      {/* 1. SECRETARIAT UTILITY BAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="bg-[#333333] text-white py-1 px-8 text-[9px] uppercase font-black tracking-[0.3em] flex justify-between items-center">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2"><ShieldCheck size={10} className="text-[#009EDB]" /> Session Active: 2026.01</span>
                <span className="opacity-20">|</span>
                <span className="text-gray-400">Registry ID: {delegate?.id?.substring(0, 12)}...</span>
            </div>
            <button onClick={handleLogout} className="hover:text-red-400 flex items-center gap-1 transition-colors uppercase">
                <LogOut size={10} /> Terminate Session
            </button>
        </div>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="KIMUN" className="h-10 w-10" />
             <div className="border-l border-gray-200 pl-4 hidden sm:block">
                <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest leading-none">Delegate Dashboard</h2>
                <p className="text-[9px] font-bold text-[#009EDB] uppercase mt-0.5">Accreditation & Liaison Service</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold text-[#003366] uppercase hidden lg:inline">{delegate?.name}</span>
            <Button variant="outline" size="sm" className="h-9">Portal Home</Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-28 pb-20">
        {/* Welcome Header */}
        <div className="bg-[#003366] text-white p-8 md:p-12 mb-10 relative overflow-hidden border-b-4 border-[#009EDB]">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <Globe size={180} />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
            <div className="space-y-3">
              <span className="inline-block bg-[#009EDB] text-[10px] font-black px-3 py-1 uppercase tracking-widest">Permanent Representation</span>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                Distinguished Delegate, <br/> {delegate?.name?.split(' ')[0] || "Representative"}
              </h1>
              <p className="text-lg text-gray-300 italic opacity-80">
                {committee?.name || "Organ Information Pending"} • <span className="text-white font-bold">{portfolio?.country || "Allocation Pending"}</span>
              </p>
            </div>
            <div className="mt-8 md:mt-0 flex items-center gap-6">
              <div className="text-right hidden sm:block">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Delegate QR Access</p>
                 <p className="text-xs font-mono">{delegate?.id}</p>
              </div>
              <div className="bg-white p-2 rounded-sm shadow-xl">
                {delegate?.id && (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${delegate?.id}`} 
                    alt="QR" className="h-20 w-20 grayscale" 
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Subsidiary Body Info */}
          <section className="bg-white border border-gray-200 shadow-sm flex flex-col group">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 cursor-pointer" onClick={() => toggleCard('committee')}>
               <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest flex items-center gap-3">
                  <Landmark size={18} className="text-[#009EDB]" /> Plenary Body
               </h2>
               <Info size={14} className="text-gray-300" />
            </div>
            <div className="p-8 flex-1 space-y-6">
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Organ Identity</label>
                  <p className="font-black text-[#003366] uppercase">{committee?.name || "Information Unavailable"}</p>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Agenda Items</label>
                  <ul className="space-y-3 mt-3">
                    {committee?.topics?.filter(t => t && t !== 'TBA').map((topic, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed italic border-l-2 border-gray-100 pl-4">
                         {topic}
                      </li>
                    )) || <li className="text-xs text-gray-400 italic">No topics assigned for this organ.</li>}
                  </ul>
               </div>
            </div>
          </section>

          {/* Portfolio Details */}
          <section className="bg-white border border-gray-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest flex items-center gap-3">
                  <Globe size={18} className="text-[#009EDB]" /> Member State
               </h2>
            </div>
            <div className="p-8 flex-1 space-y-8">
               <div className="flex items-center gap-5">
                  <DiplomaticFlag countryCode={portfolio?.countryCode || 'un'} className="w-16 h-10 shadow-sm border border-gray-100 object-cover" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Representation</p>
                    <p className="text-xl font-black text-[#003366] uppercase">{portfolio?.country || "Sovereign Entity Pending"}</p>
                  </div>
               </div>
               <div className="pt-6 border-t border-gray-50 grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protocol status</label>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`h-2 w-2 rounded-full ${delegate?.isCheckedIn ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-xs font-bold text-gray-700">{delegate?.isCheckedIn ? 'Credentialed' : 'Liaison Pending'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Org Level</label>
                    <p className="text-xs font-bold text-gray-700 mt-1 uppercase">
                      {portfolio?.minExperience === 0 ? 'General' : portfolio?.minExperience ? 'Advanced' : 'Registry Only'}
                    </p>
                  </div>
               </div>
               {delegate?.isCheckedIn && (
                 <Button onClick={handleDownloadCertificate} className="w-full h-12 bg-[#003366]">
                    <Download size={14} className="mr-2" /> Plenary Citation
                 </Button>
               )}
            </div>
          </section>

          {/* Performance Assessment */}
          <section className="bg-white border border-gray-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 cursor-pointer" onClick={() => toggleCard('performance')}>
               <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest flex items-center gap-3">
                  <Award size={18} className="text-[#009EDB]" /> Performance Metrics
               </h2>
               {expandedCard === 'performance' ? <ChevronUp size={14} className="text-gray-300" /> : <ChevronDown size={14} className="text-gray-300" />}
            </div>
            <div className="p-8 flex-1">
               {delegate?.marks ? (
                  <div className="space-y-6">
                     <div className="text-center py-4 bg-gray-50 border border-gray-100 rounded-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DIPLOMATIC EVALUATION SCORE</p>
                        <p className="text-5xl font-black text-[#003366] mt-2">{delegate.marks.total}<span className="text-lg opacity-20">/50</span></p>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        {['GSL', 'Mod', 'Lobby', 'Chits', 'FP'].map((label, i) => (
                          <div key={label} className="p-3 border border-gray-50 text-center">
                             <p className="text-[9px] font-bold text-gray-400 uppercase">{label}</p>
                             <p className="text-sm font-black text-[#003366]">{Object.values(delegate.marks!)[i+1]}</p>
                          </div>
                        ))}
                     </div>
                  </div>
               ) : (
                  <div className="text-center py-10 opacity-40">
                     <Scale size={40} className="mx-auto mb-4" strokeWidth={1} />
                     <p className="text-xs font-bold uppercase tracking-widest text-center">Assessment Pending Plenary Session Conclusion</p>
                  </div>
               )}
            </div>
          </section>
        </div>

        {/* Partners & Plenary Documents */}
        <div className="grid lg:grid-cols-2 gap-10">
           <section className="bg-white border border-gray-200 p-8 shadow-sm">
              <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest border-b border-gray-100 pb-4 mb-6 flex items-center gap-3">
                 <FileText size={18} className="text-[#009EDB]" /> Plenary Documentation
              </h3>
              <div className="space-y-4">
                 {resources.length > 0 ? resources.map(res => (
                   <div key={res.id} className="flex justify-between items-center p-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors group">
                      <div className="flex gap-4 items-center">
                         <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-[#003366] group-hover:bg-[#009EDB] group-hover:text-white transition-colors">
                            <FileText size={18} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-gray-700 uppercase">{res.title}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Document: KIMUN/REF/{res.type?.toUpperCase()}</p>
                         </div>
                      </div>
                      <a href={res.url} target="_blank" rel="noreferrer" className="text-[#009EDB] hover:text-[#003366]"><Download size={18} /></a>
                   </div>
                 )) : <p className="text-xs text-gray-400 uppercase font-bold text-center py-10">No Documents Available for Current Organ</p>}
              </div>
           </section>

           <section className="bg-white border border-gray-200 p-8 shadow-sm">
              <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest border-b border-gray-100 pb-4 mb-6 flex items-center gap-3">
                 <Calendar size={18} className="text-[#009EDB]" /> Session Itinerary
              </h3>
              <div className="space-y-6">
                 {[
                    { day: "Session I", date: "July 05", events: ["Registration 08:00", "Plenary Convening 09:00", "Organ Session I 11:00"] },
                    { day: "Session II", date: "July 06", events: ["Organ Session IV 09:00", "Resolution Drafting 14:30", "Closing Plenary 17:00"] }
                 ].map(day => (
                    <div key={day.day}>
                       <p className="text-[11px] font-black text-[#009EDB] uppercase tracking-[0.2em] mb-3">{day.day} // {day.date}</p>
                       <div className="space-y-2">
                          {day.events.map(ev => (
                             <div key={ev} className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                <div className="w-1 h-1 bg-gray-200 rounded-full" /> {ev}
                             </div>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      </main>

      <footer className="container mx-auto px-8 py-10 border-t border-gray-100 text-center">
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Secretariat Information System • Permanent Mission Hub 2026</p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        body { background-color: #F9FAFB; font-family: 'Inter', sans-serif; color: #1A1A1A; }
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      `}</style>
    </div>
  )
}

function Scale(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/>
    </svg>
  );
}

export default function App() {
  return (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-[#009EDB]" size={32} />
        </div>
    }>
      <DelegateDashboardContent />
    </Suspense>
  )
}

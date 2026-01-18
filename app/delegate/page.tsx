'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, set, update, onValue } from 'firebase/database'
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
  Globe2,
  Bell,
  FilePlus,
  Send,
  Shield,
  Search,
  CheckCircle
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
type Announcement = {
  id: string
  title: string
  content: string
  timestamp: number
  priority: 'low' | 'medium' | 'high'
}

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
  positionPaperUrl?: string
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

// --- Institutional UI Components ---
const Button = React.forwardRef<HTMLButtonElement, any>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[#003366] text-white hover:bg-[#002244] shadow-sm font-bold uppercase tracking-widest",
    primary: "bg-[#009EDB] text-white hover:bg-[#0077B3] shadow-md font-bold uppercase tracking-widest",
    outline: "border-2 border-[#009EDB] text-[#009EDB] hover:bg-[#F0F8FF] font-bold uppercase tracking-widest",
    secondary: "bg-[#4D4D4D] text-white hover:bg-[#333333] uppercase tracking-widest",
    ghost: "text-gray-500 hover:bg-gray-100 uppercase tracking-widest",
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
      className={`inline-flex items-center justify-center rounded-sm transition-all active:scale-95 disabled:opacity-50 ${variants[variant as keyof typeof variants] || variants.default} ${sizes[size as keyof typeof sizes] || sizes.default} ${className}`}
      {...props}
    />
  )
})
Button.displayName = "Button"

const DiplomaticFlag = ({ countryCode, className = "" }: { countryCode: string, className?: string }) => {
  return (
    <img 
      src={`https://flagcdn.com/w80/${countryCode?.toLowerCase() || 'un'}.png`}
      alt={`${countryCode} Representation`}
      className={`object-contain ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = 'https://flagcdn.com/w80/un.png';
      }}
    />
  );
};

function DelegateDashboardContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [delegate, setDelegate] = useState<DelegateData | null>(null)
  const [committee, setCommittee] = useState<CommitteeData | null>(null)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [posPaperInput, setPosPaperInput] = useState('')
  const [loading, setLoading] = useState({
    login: false,
    data: false,
    announcements: false
  })
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // 1. Authentication & Identity Sync
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

  // 2. Fetch Core Delegate Registry
  const fetchDelegateData = async (email: string) => {
    try {
      setLoading(prev => ({ ...prev, data: true }))
      const snapshot = await get(ref(db, 'registrations'))
      if (!snapshot.exists()) throw new Error('Dossier Not Found')

      const registrations = snapshot.val()
      let foundDelegate = null
      let regKey = ''

      for (const key in registrations) {
        const reg = registrations[key]
        if (reg.delegateInfo?.delegate1?.email === email || reg.delegateInfo?.delegate2?.email === email || reg.email === email) {
          foundDelegate = {
            id: key,
            ...(reg.delegateInfo?.delegate1 || reg),
            committeeId: reg.committeeId,
            portfolioId: reg.portfolioId,
            isCheckedIn: reg.isCheckedIn || false,
            positionPaperUrl: reg.positionPaperUrl || ''
          }
          regKey = key
          break
        }
      }

      if (!foundDelegate) throw new Error('Identity Mismatch')

      setDelegate(foundDelegate)
      setPosPaperInput(foundDelegate.positionPaperUrl || '')
      fetchCommitteeData(foundDelegate.committeeId, foundDelegate.portfolioId)
      fetchMarksData(foundDelegate.committeeId, foundDelegate.portfolioId)
      fetchResources()
      listenForAnnouncements(foundDelegate.committeeId)
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

  const listenForAnnouncements = (committeeId: string) => {
    const annRef = ref(db, `announcements/${committeeId}`)
    onValue(annRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setAnnouncements(Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a, b) => b.timestamp - a.timestamp))
      }
    })
  }

  const submitPositionPaper = async () => {
    if (!delegate?.id || !posPaperInput) return
    try {
      const regRef = ref(db, `registrations/${delegate.id}`)
      await update(regRef, { positionPaperUrl: posPaperInput })
      setDelegate(prev => ({ ...prev!, positionPaperUrl: posPaperInput }))
      toast.success('Position Paper Registry Updated')
    } catch (err) {
      toast.error('Failed to update Registry')
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(prev => ({ ...prev, login: true }))
      await signInWithPopup(auth, googleProvider)
      toast.success('Identity Verified')
    } catch (error: any) {
      toast.error('Auth Protocol Failed')
    } finally {
      setLoading(prev => ({ ...prev, login: false }))
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    setLoggedIn(false)
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
          <p className="text-gray-500 text-sm mb-10 leading-relaxed font-light">Authenticate identity via the **Unified Identity Service** to access your plenary dossier.</p>
          <Button variant="google" onClick={signInWithGoogle} disabled={loading.login} className="w-full h-14">
            {loading.login ? <Loader2 className="animate-spin mr-2" size={16} /> : <UserIcon className="mr-2" size={16} />}
            Google Identity Sync
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans selection:bg-[#009EDB]/20">
      <Toaster position="top-right" richColors />
      
      {/* 1. SECRETARIAT UTILITY BAR */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-200 shadow-sm">
        <div className="bg-[#333333] text-white py-1.5 px-8 text-[9px] uppercase font-black tracking-[0.3em] flex justify-between items-center">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-[#009EDB]"><ShieldCheck size={10} /> Identity Verified: {user?.email}</span>
                <span className="opacity-20">|</span>
                <span className="text-gray-400">ID Ref: {delegate?.id?.substring(0, 8)}</span>
            </div>
            <button onClick={handleLogout} className="hover:text-red-400 flex items-center gap-1 transition-colors uppercase">
                <LogOut size={10} /> Terminate Session
            </button>
        </div>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="KIMUN" className="h-10 w-10" />
             <div className="border-l border-gray-200 pl-4 hidden sm:block">
                <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest leading-none">Delegate Command</h2>
                <p className="text-[9px] font-bold text-[#009EDB] uppercase mt-0.5">Accreditation & Liaison Service</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase text-gray-500 tracking-widest mr-8">
              <a href="#" className="hover:text-[#009EDB]">Registry</a>
              <a href="#" className="hover:text-[#009EDB]">Documents</a>
              <a href="#" className="hover:text-[#009EDB]">Protocol</a>
            </div>
            <Button size="sm" variant="primary">Access Vault</Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-28 pb-20">
        
        {/* WELCOME BANNER & DIPLOMATIC ID */}
        <div className="grid lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 bg-[#003366] text-white p-10 relative overflow-hidden border-b-4 border-[#009EDB] flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Globe size={240} /></div>
            <div className="relative z-10 space-y-4">
              <span className="inline-block bg-[#009EDB] text-[9px] font-black px-3 py-1 uppercase tracking-widest">Plenary Session 2026.01</span>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                Excellency, <br/> {delegate?.name || "Representative"}
              </h1>
              <div className="flex items-center gap-4 pt-4">
                 <DiplomaticFlag countryCode={portfolio?.countryCode} className="w-12 h-8 border border-white/20" />
                 <p className="text-xl text-gray-300 italic">Representative of <span className="text-white font-bold uppercase">{portfolio?.country}</span></p>
              </div>
            </div>
          </div>

          {/* DIPLOMATIC ID CARD */}
          <div className="bg-white border border-gray-200 p-8 shadow-xl flex flex-col items-center text-center relative">
             <div className="absolute top-4 right-4"><QrCode size={16} className="text-gray-200" /></div>
             <div className="w-24 h-24 bg-gray-100 rounded-full mb-6 flex items-center justify-center border-4 border-[#003366]">
                <UserIcon size={40} className="text-[#003366]" />
             </div>
             <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-1">{delegate?.name}</h3>
             <p className="text-[10px] font-bold text-[#009EDB] uppercase tracking-widest mb-4">{committee?.name}</p>
             <div className="bg-gray-50 w-full py-4 rounded-sm border border-gray-100 space-y-2 mb-6">
                <div className="flex justify-between px-6">
                   <span className="text-[9px] font-bold text-gray-400 uppercase">Registry Status</span>
                   <span className={`text-[9px] font-black uppercase ${delegate?.isCheckedIn ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {delegate?.isCheckedIn ? 'VERIFIED' : 'PENDING'}
                   </span>
                </div>
                <div className="flex justify-between px-6">
                   <span className="text-[9px] font-bold text-gray-400 uppercase">Clearance</span>
                   <span className="text-[9px] font-black text-[#003366] uppercase">LEVEL I</span>
                </div>
             </div>
             <Button variant="outline" size="sm" className="w-full" onClick={() => toast.info("ID Card generation protocol initialized.")}>
                <Download size={12} className="mr-2" /> Digital Credential
             </Button>
          </div>
        </div>

        {/* NOTIFICATIONS & ANNOUNCEMENTS */}
        <section className="mb-10 bg-[#F0F8FF] border border-[#009EDB]/20 p-6 rounded-sm">
           <div className="flex items-center gap-3 mb-6">
              <Bell className="text-[#009EDB]" size={20} />
              <h2 className="text-xs font-black text-[#003366] uppercase tracking-[0.3em]">Diplomatic Bulletin Board</h2>
           </div>
           <div className="space-y-4">
              {announcements.length > 0 ? announcements.map(ann => (
                <div key={ann.id} className="bg-white p-4 border-l-4 border-[#009EDB] shadow-sm flex justify-between items-start">
                   <div>
                      <h4 className="text-sm font-black text-[#003366] uppercase tracking-tight">{ann.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{ann.content}</p>
                   </div>
                   <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(ann.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )) : (
                <p className="text-xs text-gray-400 italic text-center py-4 uppercase font-bold tracking-widest">No active alerts from the Secretariat.</p>
              )}
           </div>
        </section>

        {/* MAIN DASHBOARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Performance Evaluation */}
          <div className="bg-white border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h2 className="text-xs font-black text-[#003366] uppercase tracking-widest flex items-center gap-3">
                  <Award size={18} className="text-[#009EDB]" /> Plenary Assessment
               </h2>
            </div>
            <div className="p-8">
               {delegate?.marks ? (
                  <div className="space-y-6 text-center">
                     <div className="py-6 bg-[#003366] text-white rounded-sm shadow-inner">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-2">Aggregate Evaluation</p>
                        <p className="text-5xl font-black italic">{delegate.marks.total}<span className="text-lg opacity-30">/50</span></p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        {['GSL', 'Mod', 'Lobby', 'Chits'].map((key, i) => (
                           <div key={key} className="p-3 border border-gray-100 rounded-sm">
                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{key}</p>
                              <p className="text-sm font-black text-[#003366]">{Object.values(delegate.marks!)[i+1]}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               ) : (
                  <div className="text-center py-12 opacity-30">
                     <Scale size={48} className="mx-auto mb-4" strokeWidth={1} />
                     <p className="text-[10px] font-black uppercase tracking-widest">EVALUATION IN PROGRESS</p>
                  </div>
               )}
            </div>
          </div>

          {/* Plenary Documentation */}
          <div className="bg-white border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h2 className="text-xs font-black text-[#003366] uppercase tracking-widest flex items-center gap-3">
                  <FileText size={18} className="text-[#009EDB]" /> Registry Vault
               </h2>
            </div>
            <div className="p-6 space-y-3">
               {resources.map(res => (
                 <div key={res.id} className="p-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex justify-between items-center group transition-colors">
                    <div>
                       <p className="text-xs font-black text-[#003366] uppercase tracking-tight leading-none mb-1">{res.title}</p>
                       <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">REF: KIMUN/PLN/{res.type.toUpperCase()}</p>
                    </div>
                    <a href={res.url} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-[#009EDB] transition-colors"><Download size={16} /></a>
                 </div>
               ))}
            </div>
          </div>

          {/* Member State Representation */}
          <div className="bg-white border border-gray-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
               <h2 className="text-xs font-black text-[#003366] uppercase tracking-widest flex items-center gap-3">
                  <FilePlus size={18} className="text-[#009EDB]" /> Position Submission
               </h2>
            </div>
            <div className="p-8 space-y-6 flex-1">
               <div className="bg-blue-50 p-4 border border-blue-100 rounded-sm">
                  <p className="text-[10px] text-blue-700 leading-relaxed font-bold uppercase tracking-tight italic">
                     Delegates must submit a digital copy of their Position Paper to the Secretariat for evaluation.
                  </p>
               </div>
               <div className="space-y-4">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Document URL (Google Drive/Dropbox)</label>
                  <input 
                    type="url" 
                    placeholder="https://drive.google.com/..." 
                    className="w-full px-4 py-3 border border-gray-200 text-xs focus:border-[#009EDB] focus:outline-none"
                    value={posPaperInput}
                    onChange={(e) => setPosPaperInput(e.target.value)}
                  />
                  <Button variant="primary" className="w-full" onClick={submitPositionPaper}>
                     Update Registry <Send size={12} className="ml-2" />
                  </Button>
               </div>
               {delegate?.positionPaperUrl && (
                 <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase pt-2">
                    <CheckCircle size={14} /> Submission Confirmed
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* SESSION ITINERARY */}
        <div className="bg-white border border-gray-200 p-10 shadow-sm">
           <h3 className="text-xs font-black text-[#003366] uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
              <Calendar size={20} className="text-[#009EDB]" /> Plenary Itinerary 2026
           </h3>
           <div className="grid md:grid-cols-2 gap-12 relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-100 hidden md:block" />
              {[
                { day: "Session I", date: "July 05", events: [
                  { time: "09:00", title: "Opening Plenary", active: true },
                  { time: "11:00", title: "Organ Session I", active: false },
                  { time: "14:00", title: "Organ Session II", active: false }
                ]},
                { day: "Session II", date: "July 06", events: [
                  { time: "10:00", title: "Organ Session IV", active: false },
                  { time: "14:30", title: "Resolution Drafting", active: false },
                  { time: "17:00", title: "Final Plenary", active: false }
                ]}
              ].map(day => (
                <div key={day.day}>
                   <div className="flex items-center gap-4 mb-6">
                      <p className="text-xl font-black text-[#003366] italic">{day.day}</p>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{day.date}</span>
                   </div>
                   <div className="space-y-6">
                      {day.events.map(ev => (
                        <div key={ev.title} className="flex items-center gap-6">
                           <span className="text-[10px] font-black text-[#009EDB] w-12">{ev.time}</span>
                           <div className="flex-1 flex items-center justify-between border-b border-gray-50 pb-2">
                              <p className={`text-sm font-bold uppercase tracking-tight ${ev.active ? 'text-[#003366]' : 'text-gray-400'}`}>{ev.title}</p>
                              {ev.active && <span className="bg-[#009EDB] h-1.5 w-1.5 rounded-full animate-ping" />}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </main>

      <footer className="container mx-auto px-8 py-10 border-t border-gray-100 text-center">
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Secretariat Information System • KIMUN Mission Control 2026</p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        body { background-color: #F9FAFB; font-family: 'Inter', sans-serif; color: #1A1A1A; }
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      `}</style>
    </div>
  )
}

// --- Icons Fallback ---
function Scale(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/>
    </svg>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#009EDB]" size={32} /></div>}>
      <DelegateDashboardContent />
    </Suspense>
  )
}

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
  CheckCircle,
  ArrowRight,
  UserCheck,
  CreditCard,
  Briefcase
} from 'lucide-react'
import { Toaster, toast } from 'sonner'

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Services
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

// --- Data Schemas ---
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
  phone?: string
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

// --- Internal Components ---
const DiplomaticFlag = ({ countryCode, className = "" }: { countryCode: string, className?: string }) => {
  return (
    <img 
      src={`https://flagcdn.com/w80/${countryCode?.toLowerCase() || 'un'}.png`}
      alt="Member State Flag"
      className={`object-contain ${className}`}
      onError={(e) => { (e.target as HTMLImageElement).src = 'https://flagcdn.com/w80/un.png' }}
    />
  )
}

function DelegateDashboardContent() {
  const [user, setUser] = useState<User | null>(null)
  const [activeView, setActiveView] = useState<'command' | 'registry' | 'vault'>('command')
  const [delegate, setDelegate] = useState<DelegateData | null>(null)
  const [committee, setCommittee] = useState<CommitteeData | null>(null)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [marks, setMarks] = useState<Mark | null>(null)
  const [resources, setResources] = useState<any[]>([])
  const [posPaperInput, setPosPaperInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. Auth Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u)
        await fetchFullDossier(u.email!)
      } else {
        setUser(null)
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  // 2. Fetch Full Plenary Dossier
  const fetchFullDossier = async (email: string) => {
    try {
      const snapshot = await get(ref(db, 'registrations'))
      if (!snapshot.exists()) throw new Error('Dossier Not Found')

      const registrations = snapshot.val()
      let foundReg = null
      let regId = ''

      for (const key in registrations) {
        const reg = registrations[key]
        if (reg.delegateInfo?.delegate1?.email === email || reg.email === email) {
          foundReg = reg
          regId = key
          break
        }
      }

      if (!foundReg) throw new Error('Registry ID Mismatch')

      const delegateObj: DelegateData = {
        id: regId,
        ...(foundReg.delegateInfo?.delegate1 || foundReg),
        committeeId: foundReg.committeeId,
        portfolioId: foundReg.portfolioId,
        isCheckedIn: foundReg.isCheckedIn || false,
        positionPaperUrl: foundReg.positionPaperUrl || ''
      }

      setDelegate(delegateObj)
      setPosPaperInput(delegateObj.positionPaperUrl || '')

      // Parallel Data Fetching
      fetchCommitteeInfo(delegateObj.committeeId, delegateObj.portfolioId)
      fetchRegistryDocs()
      listenToMarks(delegateObj.committeeId, delegateObj.portfolioId)
      
      setLoading(false)
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  const fetchCommitteeInfo = async (cid: string, pid: string) => {
    const snapshot = await get(ref(db, `committees/${cid}`))
    if (snapshot.exists()) {
      const data = snapshot.val()
      setCommittee(data)
      if (data.portfolios && pid) setPortfolio(data.portfolios[pid])
    }
  }

  const fetchRegistryDocs = async () => {
    const snapshot = await get(ref(db, 'resources'))
    if (snapshot.exists()) {
      const data = snapshot.val()
      setResources(Object.keys(data).map(k => ({ id: k, ...data[k] })))
    }
  }

  const listenToMarks = (cid: string, pid: string) => {
    const marksRef = ref(db, `marksheets/${cid}/marks`)
    onValue(marksRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const myMarks = Object.values(data).find((m: any) => m.portfolioId === pid) as Mark
        if (myMarks) setMarks(myMarks)
      }
    })
  }

  // 3. Functional Actions
  const handlePositionPaperSubmit = async () => {
    if (!delegate || !posPaperInput) return
    setIsSubmitting(true)
    try {
      await update(ref(db, `registrations/${delegate.id}`), {
        positionPaperUrl: posPaperInput
      })
      setDelegate(prev => ({ ...prev!, positionPaperUrl: posPaperInput }))
      toast.success('Position Paper URL Registered')
    } catch (err) {
      toast.error('Registry Update Failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      toast.success('Identity Synced')
    } catch (err) {
      toast.error('Sync Failed')
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = '/'
  }

  // --- UI Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-[#009EDB] mb-6" size={48} strokeWidth={3} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Syncing Registry Dossier...</span>
      </div>
    )
  }

  // --- Unauthenticated State ---
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-zinc-200 shadow-2xl p-12 text-center rounded-sm border-t-4 border-t-[#003366]">
          <Landmark size={64} className="text-[#003366] mx-auto mb-8" strokeWidth={1.5} />
          <h1 className="text-2xl font-black text-[#003366] uppercase tracking-tighter mb-4">Delegate Entrance</h1>
          <p className="text-zinc-500 text-sm mb-10 leading-relaxed italic">Synchronize your Google Identity to access the plenary mission controls.</p>
          <button onClick={handleLogin} className="w-full h-14 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-sm flex items-center justify-center gap-4 transition-all active:scale-95 group">
             <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
             <span className="text-[11px] font-black uppercase tracking-widest text-zinc-700">Identity Sync via Google</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 font-sans selection:bg-[#009EDB]/20">
      <Toaster position="top-right" richColors />
      
      {/* --- INSTITUTIONAL NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        <div className="bg-[#4D4D4D] text-white py-1.5 px-8 text-[9px] uppercase font-black tracking-widest flex justify-between items-center">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-[#009EDB]"><ShieldCheck size={10} /> Plenary Access Verified: {user.email}</span>
                <span className="opacity-20">|</span>
                <span className="text-zinc-400">ID: {delegate?.id?.substring(0, 10)}</span>
            </div>
            <button onClick={handleLogout} className="hover:text-red-400 flex items-center gap-1 transition-colors uppercase font-black">
                <LogOut size={10} /> Terminate
            </button>
        </div>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
             <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Logo" className="h-10 w-10" />
             <div className="border-l border-zinc-200 pl-4 hidden md:block">
                <h2 className="text-sm font-black text-[#003366] uppercase tracking-tighter leading-none">Delegate Command</h2>
                <p className="text-[10px] font-bold text-[#009EDB] uppercase mt-0.5 tracking-widest">KIMUN 2026</p>
             </div>
          </div>
          <div className="flex items-center gap-2 md:gap-8">
            <nav className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
               {['command', 'registry', 'vault'].map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setActiveView(tab as any)}
                   className={`hover:text-[#009EDB] transition-colors ${activeView === tab ? 'text-[#009EDB] border-b-2 border-[#009EDB] pb-1' : ''}`}
                 >
                   {tab}
                 </button>
               ))}
            </nav>
            <button onClick={() => window.location.href = '/'} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-[#003366] transition-all">
                <Globe size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="container mx-auto px-6 pt-32 pb-24">
        
        {activeView === 'command' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            
            {/* HERO & DIGITAL ID CARD */}
            <div className="grid lg:grid-cols-3 gap-10">
               {/* BANNER */}
               <div className="lg:col-span-2 bg-[#003366] text-white p-10 md:p-16 rounded-sm relative overflow-hidden flex flex-col justify-center border-b-8 border-b-[#009EDB]">
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Globe size={300} /></div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                       <span className="bg-[#009EDB] text-[9px] font-black px-4 py-1.5 uppercase tracking-[0.2em]">Authorized Representative</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85]">
                       Distinguished, <br/> {delegate?.name?.split(' ')[0] || "Delegate"}
                    </h1>
                    <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                       <DiplomaticFlag countryCode={portfolio?.countryCode} className="w-14 h-10 border border-white/20 shadow-xl" />
                       <p className="text-xl text-zinc-300 italic font-light">Representing the sovereignty of <span className="text-white font-black uppercase tracking-tight">{portfolio?.country || "Registry Error"}</span></p>
                    </div>
                  </div>
               </div>

               {/* DIGITAL ID CARD */}
               <div className="bg-white border border-zinc-200 shadow-2xl p-10 flex flex-col items-center text-center relative overflow-hidden rounded-sm group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#009EDB]" />
                  <div className="w-32 h-32 bg-zinc-50 rounded-full mb-8 flex items-center justify-center border-4 border-zinc-100 relative group-hover:border-[#003366] transition-colors">
                     <UserIcon size={56} className="text-zinc-200 group-hover:text-[#003366] transition-colors" />
                     {delegate?.isCheckedIn && (
                       <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg">
                          <ShieldCheck size={14} />
                       </div>
                     )}
                  </div>
                  <h3 className="text-lg font-black text-[#003366] uppercase tracking-tighter mb-1 leading-none">{delegate?.name}</h3>
                  <p className="text-[10px] font-bold text-[#009EDB] uppercase tracking-[0.2em] mb-8 italic">{committee?.name || "Allocation Pending"}</p>
                  
                  <div className="w-full bg-zinc-50 p-6 rounded-sm border border-zinc-100 space-y-4 mb-8">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        <span>Registry Ref</span>
                        <span className="text-[#003366] font-mono">{delegate?.id?.substring(0, 8)}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        <span>Security Clear</span>
                        <span className="text-emerald-600">LEVEL I (DIPLOMATIC)</span>
                     </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full">
                      <div className="bg-white p-2 border border-zinc-100 rounded-sm inline-block mx-auto mb-2">
                         <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${delegate?.id}`} alt="Registry QR" className="w-20 h-20 grayscale hover:grayscale-0 transition-all cursor-zoom-in" />
                      </div>
                      <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest">Secretariat Verification Code</p>
                  </div>
               </div>
            </div>

            {/* QUICK ACTIONS & FEED */}
            <div className="grid lg:grid-cols-3 gap-8">
               
               {/* POSITION PAPER SUBMISSION */}
               <div className="bg-white border border-zinc-200 p-8 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-8 border-b border-zinc-50 pb-4">
                     <FilePlus className="text-[#009EDB]" size={20} />
                     <h3 className="text-xs font-black text-[#003366] uppercase tracking-widest">Position Submission</h3>
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-6 leading-relaxed italic font-medium">Please provide the public URL to your research document for evaluative review by the Moderator board.</p>
                  <div className="space-y-4 flex-1">
                     <input 
                       type="url" 
                       placeholder="https://drive.google.com/..." 
                       className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 text-xs focus:bg-white focus:border-[#009EDB] focus:outline-none transition-all"
                       value={posPaperInput}
                       onChange={(e) => setPosPaperInput(e.target.value)}
                     />
                     <button 
                       onClick={handlePositionPaperSubmit}
                       disabled={isSubmitting}
                       className="w-full h-12 bg-[#003366] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#002244] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                     >
                        {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={12} />}
                        Update Registry
                     </button>
                     {delegate?.positionPaperUrl && (
                        <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-600 uppercase pt-2 animate-in fade-in">
                           <CheckCircle2 size={12} /> Logged in Secretariat Database
                        </div>
                     )}
                  </div>
               </div>

               {/* ASSESSMENT SCORECARD */}
               <div className="bg-white border border-zinc-200 p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-8 border-b border-zinc-50 pb-4">
                     <Award className="text-[#009EDB]" size={20} />
                     <h3 className="text-xs font-black text-[#003366] uppercase tracking-widest">Plenary Assessment</h3>
                  </div>
                  {marks ? (
                    <div className="space-y-6">
                       <div className="bg-[#003366] text-white p-6 text-center rounded-sm shadow-inner relative overflow-hidden">
                          <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 mb-2">Aggregate Evaluation</p>
                          <p className="text-5xl font-black italic">{marks.total}<span className="text-lg opacity-20 ml-1">/50</span></p>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          {[
                            { l: 'GSL', v: marks.gsl },
                            { l: 'Mod', v: marks.mod1 },
                            { l: 'Lobby', v: marks.lobby },
                            { l: 'Rules', v: marks.fp }
                          ].map(m => (
                            <div key={m.l} className="p-3 border border-zinc-50 text-center bg-zinc-50/50">
                               <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{m.l}</p>
                               <p className="text-sm font-black text-[#003366]">{m.v}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 text-center">
                       <Scale size={48} className="mb-4" strokeWidth={1} />
                       <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Evaluation Phase <br/> Not Initialized</p>
                    </div>
                  )}
               </div>

               {/* SESSION PULSE ITINERARY */}
               <div className="bg-white border border-zinc-200 p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-8 border-b border-zinc-50 pb-4">
                     <Clock className="text-[#009EDB]" size={20} />
                     <h3 className="text-xs font-black text-[#003366] uppercase tracking-widest">Plenary Pulse</h3>
                  </div>
                  <div className="space-y-6">
                     {[
                       { t: '09:00', l: 'Opening Convening', active: true },
                       { t: '11:00', l: 'Subsidiary Session I', active: false },
                       { t: '14:00', l: 'Subsidiary Session II', active: false },
                       { t: '17:00', l: 'Bureau Review', active: false }
                     ].map(ev => (
                       <div key={ev.l} className="flex items-center gap-6">
                          <span className={`text-[10px] font-black w-10 ${ev.active ? 'text-[#009EDB]' : 'text-zinc-300'}`}>{ev.t}</span>
                          <div className={`flex-1 border-b border-zinc-50 pb-2 flex justify-between items-center`}>
                             <span className={`text-[11px] font-bold uppercase tracking-tight ${ev.active ? 'text-[#003366]' : 'text-zinc-400'}`}>{ev.l}</span>
                             {ev.active && <span className="h-1.5 w-1.5 bg-[#009EDB] rounded-full animate-ping" />}
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* DOCUMENTATION GRID */}
            <div className="bg-white border border-zinc-200 p-10 shadow-sm">
               <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                  <div>
                    <h3 className="text-2xl font-black text-[#003366] uppercase tracking-tighter">Registry Vault</h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1 italic">Official KIMUN documentation & background intel</p>
                  </div>
                  <button onClick={() => setActiveView('vault')} className="text-[#009EDB] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                    View Complete Index <ArrowRight size={14} />
                  </button>
               </div>
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resources.slice(0, 3).map(res => (
                    <div key={res.id} className="p-6 border border-zinc-100 hover:border-[#009EDB]/30 hover:bg-[#F0F8FF]/30 transition-all group rounded-sm">
                        <div className="w-10 h-10 bg-zinc-50 rounded-sm mb-4 flex items-center justify-center text-zinc-400 group-hover:bg-[#009EDB] group-hover:text-white transition-colors">
                           <FileText size={20} />
                        </div>
                        <h4 className="text-sm font-black text-[#003366] uppercase tracking-tight mb-1">{res.title}</h4>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Ref: KIMUN/PLN/{res.type?.toUpperCase()}</p>
                        <a href={res.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#009EDB] text-[10px] font-black uppercase tracking-widest hover:text-[#003366]">
                           Download <Download size={12} />
                        </a>
                    </div>
                  ))}
               </div>
            </div>

          </motion.div>
        )}

        {activeView === 'registry' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="bg-white border border-zinc-200 p-12 text-center space-y-4">
                <Search size={48} className="mx-auto text-zinc-200" />
                <h2 className="text-2xl font-black text-[#003366] uppercase tracking-tighter">Plenary Registry Access</h2>
                <p className="text-sm text-zinc-500 max-w-md mx-auto italic font-light leading-relaxed">
                   The public Member State matrix and committee allocations index is undergoing plenary synchronization. Access will be restored via the main gateway shortly.
                </p>
                <button onClick={() => setActiveView('command')} className="text-[#009EDB] text-[10px] font-black uppercase tracking-widest hover:underline pt-4">Return to Mission Control</button>
             </div>
          </div>
        )}

        {activeView === 'vault' && (
           <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-10">
              <h2 className="text-4xl font-black text-[#003366] uppercase tracking-tighter">Plenary Vault Index</h2>
              <div className="grid gap-4">
                 {resources.map(res => (
                   <div key={res.id} className="bg-white border border-zinc-200 p-6 flex justify-between items-center group hover:border-[#009EDB] transition-all">
                      <div className="flex items-center gap-6">
                         <div className="p-3 bg-zinc-50 rounded-sm text-zinc-300 group-hover:bg-[#009EDB]/10 group-hover:text-[#009EDB] transition-colors">
                            <FileText size={24} />
                         </div>
                         <div>
                            <h4 className="text-base font-black text-[#003366] uppercase tracking-tight">{res.title}</h4>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">{res.description || "Official Plenary Document"}</p>
                         </div>
                      </div>
                      <a href={res.url} target="_blank" rel="noreferrer" className="p-4 hover:bg-zinc-50 rounded-full text-zinc-300 hover:text-[#009EDB] transition-colors">
                         <Download size={20} />
                      </a>
                   </div>
                 ))}
              </div>
           </div>
        )}

      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-zinc-200 py-16">
        <div className="container mx-auto px-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex items-center gap-4">
                 <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Logo" className="h-12 w-12 grayscale opacity-40" />
                 <div>
                    <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest leading-none">Secretariat Info System</h4>
                    <p className="text-[9px] font-bold text-zinc-300 uppercase mt-1 tracking-[0.2em]">Protocol Secured // 2026.01</p>
                 </div>
              </div>
              <div className="flex gap-10 text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                 <a href="/" className="hover:text-[#003366]">Gateway</a>
                 <a href="/matrix" className="hover:text-[#003366]">Registry</a>
                 <a href="#" className="hover:text-[#003366]">Charter</a>
                 <a href="#" className="hover:text-[#003366]">Support</a>
              </div>
           </div>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        body { background-color: #F9FAFB; font-family: 'Inter', sans-serif; color: #1A1A1A; }
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        
        /* Diplomatic Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #F9FAFB; }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #009EDB; }
      `}</style>
    </div>
  )
}

function Scale(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/>
    </svg>
  );
}

export default function App() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#009EDB]" size={32} />
        </div>
    }>
      <DelegateDashboardContent />
    </Suspense>
  )
}

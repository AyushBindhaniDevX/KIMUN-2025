"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, CheckCircle, Globe, Users, Settings, AlertCircle, 
  ChevronRight, Calendar, Clock, Lock, Unlock, FileText, 
  ShieldCheck, Landmark, Search, ArrowLeft, ArrowRight,
  UserCheck, ClipboardList, CreditCard, MessageSquare
} from 'lucide-react'
import Flags from 'country-flag-icons/react/3x2'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, push, update } from 'firebase/database'

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
  { name: "Final Convening", startDate: new Date('2025-06-15'), endDate: new Date('2025-12-30'), singlePrice: 999, doublePrice: 1999 }
];

const VALID_COUPONS: Record<string, number> = {
  "BGUDELEGATION": 99,
  "RAVENSHAWDELEGATION": 99,
  "SOADELEGATION": 99,
  "KIMUN2024RECVR1299": 1299,
  "KIMUN2025WINWAR": 100,
};

// --- Institutional Components ---
const Button = React.forwardRef<HTMLButtonElement, any>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[#009EDB] text-white hover:bg-[#0077B3] shadow-sm font-bold",
    outline: "border-2 border-[#009EDB] text-[#009EDB] hover:bg-[#F0F8FF] font-bold",
    secondary: "bg-[#4D4D4D] text-white hover:bg-[#333333]",
    ghost: "text-gray-500 hover:bg-gray-100"
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

// --- Main Accreditation Page ---
export default function App() {
  const [step, setStep] = useState(1)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [delegateInfo, setDelegateInfo] = useState<DelegateInfo>({
    delegate1: { name: '', email: '', phone: '', institution: '', year: '', course: '', experience: '' }
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

  const app = initializeApp(firebaseConfig)
  const db = getDatabase(app)

  useEffect(() => {
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
  }, [db])

  // --- Handlers ---
  const handleInputChange = (delegate: 'delegate1' | 'delegate2', field: string, value: string) => {
    setDelegateInfo(prev => ({
      ...prev, [delegate]: { ...prev[delegate]!, [field]: value }
    }))
  }

  const validateStep = () => {
    const d1 = delegateInfo.delegate1
    const baseValid = d1.name && d1.email && d1.phone && d1.institution && d1.year && d1.course && d1.experience
    let d2Valid = true
    if (isDoubleDel) {
      const d2 = delegateInfo.delegate2
      d2Valid = !!(d2 && d2.name && d2.email && d2.phone && d2.institution && d2.year && d2.course && d2.experience)
    }

    const checkBlacklist = (info: DelegateData) => {
      const entry = BLACKLIST.find(e => e.email.toLowerCase() === info.email.toLowerCase() || e.phone === info.phone)
      if (entry) { setError(`SECURITY CLEARANCE DENIED: ${entry.reason}`); return true }
      return false
    }

    if (checkBlacklist(delegateInfo.delegate1) || (isDoubleDel && delegateInfo.delegate2 && checkBlacklist(delegateInfo.delegate2))) return false
    return !!(baseValid && d2Valid)
  }

  const applyCoupon = () => {
    const code = couponCode.toUpperCase()
    if (VALID_COUPONS[code]) {
      setDiscount(VALID_COUPONS[code]); setCouponApplied(true); setCouponError('')
    } else {
      setCouponError('Protocol: Invalid Credential Code'); setDiscount(0); setCouponApplied(false)
    }
  }

  const calculatePrice = () => {
    if (!currentPhase) return 0
    const base = selectedCommittee?.isOnline ? 49 : (isDoubleDel ? currentPhase.doublePrice : currentPhase.singlePrice)
    return Math.max(0, base - discount)
  }

  const getAverageExperience = () => {
    const exp1 = parseInt(delegateInfo.delegate1.experience) || 0
    if (!isDoubleDel || !delegateInfo.delegate2) return exp1
    const exp2 = parseInt(delegateInfo.delegate2.experience) || 0
    return Math.round((exp1 + exp2) / 2)
  }

  const initiateAccreditation = async () => {
    if (!validateStep()) return
    
    if (whatsappRegistration) {
        const d1 = delegateInfo.delegate1; const d2 = delegateInfo.delegate2;
        let msg = `*KIMUN ACCREDITATION REQUEST*%0A%0A*Committee:* ${selectedCommittee?.name}%0A*Portfolio:* ${selectedPortfolio?.country}%0A*Type:* ${isDoubleDel ? 'Double' : 'Single'}%0A*Fee:* ₹${calculatePrice()}%0A%0A*Delegate 1:* ${d1.name}%0A*Institution:* ${d1.institution}%0A`
        if (isDoubleDel && d2) msg += `*Delegate 2:* ${d2.name}%0A`
        msg += `%0APlease verify credentials and provide Plenary Session access.`;
        window.open(`https://wa.me/918249979557?text=${msg}`, '_blank')
    } else {
        // Razorpay logic (Simplified for placeholder)
        setError("Secure Payment Gateway undergoing maintenance. Please use WhatsApp Protocol.")
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center font-sans">
      <Loader2 className="animate-spin text-[#009EDB] mb-4" size={48} strokeWidth={3} />
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Consulting Member State Registry...</span>
    </div>
  )

  if (!registrationOpen) return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-xl bg-white p-12 border-t-8 border-[#4D4D4D] shadow-2xl rounded-sm">
        <Lock className="w-20 h-20 text-gray-300 mx-auto mb-8" />
        <h1 className="text-2xl font-black text-[#333333] mb-4 uppercase tracking-tighter">Portal Session Concluded</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">The accreditation gateway for the current session is offline. Please refer to the official Secretariat Calendar for the next convening window.</p>
        <div className="space-y-3">
            {ACCREDITATION_PHASES.map((p, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-bold p-3 bg-gray-50 border border-gray-100 uppercase tracking-widest">
                    <span className="text-gray-400">{p.name}</span>
                    <span className="text-gray-300">Archive</span>
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
            <span>UN Accreditation & Liaison Service // KIMUN 2026</span>
            <span>Ref: KIMUN/ACC/GATEWAY</span>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Emblem" className="h-14 w-14" />
            <div className="border-l-2 border-gray-100 pl-6">
               <h1 className="text-lg font-black text-[#003366] leading-none uppercase tracking-tighter">Credentials Portal</h1>
               <p className="text-[10px] font-black text-[#009EDB] uppercase tracking-[0.2em] mt-1">Institutional Plenary Session 2026</p>
            </div>
          </div>
          <div className="hidden md:flex gap-10">
             {[1,2,3,4,5].map(i => (
                <ProgressStep 
                    key={i} 
                    current={step} 
                    step={i} 
                    label={["Status", "Details", "Organs", "Allocation", "Verify"][i-1]} 
                    icon={[Settings, Users, Landmark, Globe, ShieldCheck][i-1]}
                />
             ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-gray-200 shadow-xl rounded-sm p-10 lg:p-16 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#009EDB]" />

            {/* STEP 1: DELEGATION STATUS */}
            {step === 1 && (
              <div className="space-y-10">
                <div>
                   <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter mb-2">Diplomatic Status</h2>
                   <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Select your accreditation profile for the 2026 Plenary</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { val: false, title: "Single Delegation", desc: "Plenary representative for a specific Member State portfolio." },
                    { val: true, title: "Double Delegation", desc: "Joint representation protocol (Limited subsidiary bodies only)." }
                  ].map((opt, i) => (
                    <div 
                      key={i}
                      onClick={() => setIsDoubleDel(opt.val)}
                      className={`p-8 border-2 cursor-pointer transition-all ${isDoubleDel === opt.val ? 'border-[#009EDB] bg-[#F0F8FF]' : 'border-gray-100 hover:border-gray-300'}`}
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

                <div className="bg-gray-50 p-6 flex items-center gap-5 border border-gray-100">
                    <Info className="text-[#009EDB]" size={24} />
                    <div>
                        <p className="text-[10px] font-black uppercase text-[#009EDB] tracking-widest">Current Accreditation Window</p>
                        <p className="text-sm font-bold text-[#003366]">{currentPhase?.name} pricing is currently active through institutional mandate.</p>
                    </div>
                </div>

                <Button onClick={() => setStep(2)} className="w-full h-16 text-lg">Next: Delegate Credentials <ChevronRight className="ml-3" /></Button>
              </div>
            )}

            {/* STEP 2: DIPLOMATIC DETAILS */}
            {step === 2 && (
              <div className="space-y-12">
                <div className="flex justify-between items-end border-b-2 border-gray-50 pb-6">
                   <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter leading-none">Delegate <br/>Dossier.</h2>
                   <div className="bg-[#003366] text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest">Clearance Level I</div>
                </div>

                <div className="space-y-10">
                   <DelegateForm 
                      title="Primary Representative" 
                      data={delegateInfo.delegate1} 
                      onChange={(f, v) => handleInputChange('delegate1', f, v)} 
                   />
                   {isDoubleDel && (
                     <DelegateForm 
                        title="Secondary Representative" 
                        data={delegateInfo.delegate2 || {} as DelegateData} 
                        onChange={(f, v) => handleInputChange('delegate2', f, v)} 
                     />
                   )}
                </div>

                <div className="flex gap-6">
                   <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                   <Button onClick={() => validateStep() ? setStep(3) : null} className="flex-[2]">Confirm Credentials <ChevronRight className="ml-3" /></Button>
                </div>
                {error && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest mt-4 animate-pulse"><AlertCircle className="inline mr-2" size={14} /> {error}</p>}
              </div>
            )}

            {/* STEP 3: ORGAN SELECTION */}
            {step === 3 && (
              <div className="space-y-10">
                <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter">Subsidiary Body Selection</h2>
                <div className="grid gap-4">
                   {committees.map((c, i) => (
                      <div 
                        key={c.id} 
                        onClick={() => setSelectedCommittee(c)}
                        className={`p-6 border-2 flex items-center gap-6 cursor-pointer transition-all ${selectedCommittee?.id === c.id ? 'border-[#009EDB] bg-[#F0F8FF]' : 'border-gray-50 hover:border-gray-200'}`}
                      >
                         <div className="text-3xl grayscale group-hover:grayscale-0">{c.emoji}</div>
                         <div className="flex-1">
                            <div className="flex justify-between">
                               <h4 className="font-bold text-[#003366] uppercase tracking-tight">{c.name}</h4>
                               {c.isOnline && <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest">Online Organ</span>}
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Organ Code: KIMUN/C-{i+1} • {c.portfolios.filter(p => p.isVacant).length} Seats Available</p>
                         </div>
                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedCommittee?.id === c.id ? 'border-[#009EDB]' : 'border-gray-200'}`}>
                           {selectedCommittee?.id === c.id && <div className="w-2 h-2 bg-[#009EDB] rounded-full" />}
                        </div>
                      </div>
                   ))}
                </div>
                <div className="flex gap-6">
                   <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                   <Button onClick={() => selectedCommittee ? setStep(4) : setError('Select an Organ')} className="flex-[2]">Proceed to Allocation <ChevronRight className="ml-3" /></Button>
                </div>
              </div>
            )}

            {/* STEP 4: PORTFOLIO ALLOCATION */}
            {step === 4 && (
              <div className="space-y-10">
                <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter">Member State Allocation</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {selectedCommittee?.portfolios
                    .filter(p => p.isVacant && (isDoubleDel ? p.isDoubleDelAllowed : true) && getAverageExperience() >= p.minExperience)
                    .map(p => (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedPortfolio(p)}
                        className={`p-5 border-2 flex flex-col items-center text-center gap-3 cursor-pointer transition-all ${selectedPortfolio?.id === p.id ? 'border-[#009EDB] bg-[#F0F8FF]' : 'border-gray-50 hover:border-gray-200'}`}
                      >
                         {Flags[p.countryCode] && React.createElement(Flags[p.countryCode], { className: 'w-10 h-10 shadow-sm border border-gray-100' })}
                         <span className="text-[11px] font-bold text-[#003366] uppercase leading-tight">{p.country}</span>
                         {selectedPortfolio?.id === p.id && <CheckCircle className="text-[#009EDB] absolute top-2 right-2" size={16} />}
                      </div>
                    ))}
                </div>
                <div className="flex gap-6">
                   <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
                   <Button onClick={() => selectedPortfolio ? setStep(5) : setError('Select a Member State')} className="flex-[2]">Review Credentials <ChevronRight className="ml-3" /></Button>
                </div>
              </div>
            )}

            {/* STEP 5: FINAL VERIFICATION */}
            {step === 5 && (
              <div className="space-y-10">
                <div className="bg-[#003366] text-white p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Accreditation Surcharge</p>
                      <h3 className="text-4xl font-black italic tracking-tighter uppercase">Total: ₹{calculatePrice()}</h3>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#009EDB]">Calculated per Plenary Rules v2026</p>
                   </div>
                   <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-sm">
                      <input 
                        placeholder="PROTOCOL CODE" 
                        className="bg-transparent text-white text-[10px] font-black tracking-widest uppercase focus:outline-none w-32"
                        value={couponCode} onChange={e => setCouponCode(e.target.value)}
                      />
                      <Button size="sm" onClick={applyCoupon} variant="outline" className="border-[#009EDB] text-[#009EDB]">Apply</Button>
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <h4 className="text-xs font-black uppercase text-[#009EDB] tracking-[0.2em] border-b border-gray-100 pb-2">Institutional Allocation</h4>
                      <div className="space-y-4">
                         <div className="flex items-center gap-4">
                            <Landmark size={24} className="text-gray-300" />
                            <div>
                               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">subsidiary body</p>
                               <p className="text-sm font-bold text-[#003366] uppercase">{selectedCommittee?.name}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <Globe size={24} className="text-gray-300" />
                            <div>
                               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">sovereign representation</p>
                               <p className="text-sm font-bold text-[#003366] uppercase">{selectedPortfolio?.country}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="text-xs font-black uppercase text-[#009EDB] tracking-[0.2em] border-b border-gray-100 pb-2">Diplomatic Channel</h4>
                      <div className="p-6 bg-gray-50 border border-gray-100 rounded-sm">
                         <label className="flex items-center gap-4 cursor-pointer">
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${whatsappRegistration ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                               <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${whatsappRegistration ? 'translate-x-6' : ''}`} />
                               <input type="checkbox" className="sr-only" checked={whatsappRegistration} onChange={() => setWhatsappRegistration(!whatsappRegistration)} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-[#333] tracking-widest">Accredit via WhatsApp Protocol</span>
                         </label>
                         <p className="text-[9px] text-gray-500 mt-4 italic">Direct communication line with the Secretariat for prioritized clearance.</p>
                      </div>
                   </div>
                </div>

                <div className="flex gap-6 pt-10 border-t border-gray-50">
                   <Button variant="outline" onClick={() => setStep(4)} className="flex-1">Back</Button>
                   <Button onClick={initiateAccreditation} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 h-16">
                      Initialize Final Clearance <ArrowRight className="ml-3" />
                   </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-10 border-t border-gray-100 text-center">
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Kalinga International MUN Secretariat • Official Information System</p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;900&display=swap');
        body { background-color: #F9FAFB; font-family: 'Inter', sans-serif; }
        * { -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  )
}

function DelegateForm({ title, data, onChange }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black uppercase text-[#009EDB] tracking-[0.3em] border-l-4 border-[#009EDB] pl-4">{title}</h3>
      <div className="grid md:grid-cols-2 gap-5">
        {[
          { f: 'name', label: 'Full Legal Name', i: UserCheck },
          { f: 'email', label: 'Diplomatic Email', i: FileText },
          { f: 'phone', label: 'Primary Liaison Number', i: MessageSquare },
          { f: 'institution', label: 'Academic Mission', i: Landmark },
          { f: 'year', label: 'Year of Study', i: Calendar },
          { f: 'course', label: 'Degree Program', i: ClipboardList },
          { f: 'experience', label: 'Number of Convenings (MUNs)', i: Award },
        ].map((input) => (
          <div key={input.f} className="relative">
            <input 
               className="w-full bg-gray-50 border-b-2 border-gray-200 py-3 px-10 text-sm focus:border-[#009EDB] focus:outline-none transition-colors"
               placeholder={input.label}
               value={data[input.f] || ''}
               onChange={(e) => onChange(input.f, e.target.value)}
            />
            <input.i className="absolute left-2 top-3 text-gray-300" size={18} />
          </div>
        ))}
      </div>
    </div>
  )
}

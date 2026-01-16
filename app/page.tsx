"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { 
  Calendar, ChevronRight, Globe, MapPin, Users, Loader2,
  Shield, Activity, Play, FileText, Search, ExternalLink,
  Info, AlertCircle, Menu, X, CheckCircle2, Award, Briefcase, Landmark,
  ShieldCheck, Scale, Gavel, Globe2
} from "lucide-react"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, get, set } from "firebase/database"

// --- Firebase configuration ---
const firebaseConfig = {
  apiKey: "", 
  authDomain: "kimun-2025.firebaseapp.com",
  databaseURL: "https://kimun-2025-default-rtdb.firebaseio.com",
  projectId: "kimun-2025",
  storageBucket: "kimun-2025.appspot.com",
  messagingSenderId: "367175515228",
  appId: "1:367175515228:web:7586526e0310245037233a"
}

// --- Interfaces ---
interface Portfolio {
  id: string;
  country: string;
  countryCode: string;
  isVacant: boolean;
}

interface Committee {
  id: string;
  name: string;
  emoji: string;
  portfolios: Portfolio[];
}

// --- UN Institutional Components ---
const Button = React.forwardRef<HTMLButtonElement, any>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[#009EDB] text-white hover:bg-[#0077B3] shadow-sm font-bold",
    outline: "border-2 border-[#009EDB] text-[#009EDB] hover:bg-[#F0F8FF] font-bold",
    secondary: "bg-[#4D4D4D] text-white hover:bg-[#333333]",
    ghost: "text-gray-600 hover:bg-gray-100"
  }
  const sizes = {
    default: "h-10 px-6 py-2 text-xs",
    lg: "h-14 px-10 text-sm font-black",
    sm: "h-8 px-4 text-[10px]"
  }
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-sans uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${variants[variant as keyof typeof variants] || variants.default} ${sizes[size as keyof typeof sizes] || sizes.default} ${className}`}
      {...props}
    />
  )
})
Button.displayName = "Button"

export default function App() {
  const [isMounted, setIsMounted] = useState(false)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [underMaintenance, setUnderMaintenance] = useState(false)
  const [countdown, setCountdown] = useState(600)
  const [scrolled, setScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const [refHero, inViewHero] = useInView({ threshold: 0.1, triggerOnce: true })
  const [refNews, inViewNews] = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    setIsMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    
    const fetchData = async () => {
      try {
        const app = initializeApp(firebaseConfig)
        const db = getDatabase(app)
        const maintenanceRef = ref(db, 'maintenance')
        const maintenanceSnapshot = await get(maintenanceRef)
        
        if (maintenanceSnapshot.exists()) {
          const maintenanceData = maintenanceSnapshot.val()
          setUnderMaintenance(maintenanceData.enabled)
          if (maintenanceData.enabled) {
            const timer = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(timer)
                  window.location.reload()
                  return 0
                }
                return prev - 1
              })
            }, 1000)
            return () => clearInterval(timer)
          }
        }

        const committeesRef = ref(db, 'committees')
        const snapshot = await get(committeesRef)
        if (snapshot.exists()) {
          const data = snapshot.val()
          const arr = Object.keys(data).map(key => ({
            id: key,
            ...data[key],
            portfolios: Object.keys(data[key].portfolios || {}).map(pk => ({
              id: pk,
              ...data[key].portfolios[pk]
            }))
          }))
          setCommittees(arr)
        }
        setLoading(false)
      } catch (err) {
        setLoading(false)
      }
    }
    fetchData()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [underMaintenance])

  if (!isMounted) return null

  // --- Diplomatic Maintenance Notice ---
  if (underMaintenance) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-2xl bg-white p-16 border-t-8 border-[#009EDB] shadow-2xl rounded-sm">
          <div className="w-24 h-24 bg-[#009EDB]/10 text-[#009EDB] rounded-full flex items-center justify-center mx-auto mb-10">
            <Landmark size={48} />
          </div>
          <h1 className="text-3xl font-black text-[#003366] mb-6 uppercase tracking-tighter">Accreditation Gateway Suspended</h1>
          <p className="text-gray-600 mb-10 leading-relaxed text-sm max-w-md mx-auto">
            Per Administrative Instruction **KIMUN/AI/2026/04**, the permanent mission portal is currently undergoing a security audit. Diplomatic access will be restored shortly.
          </p>
          <div className="bg-[#003366] p-8 mb-10 text-white">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold mb-3 opacity-70">Estimated Time to Restoration</p>
            <div className="text-5xl font-mono font-black italic">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </div>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-16">
            Re-Initialize Credentials
          </Button>
        </div>
        <p className="mt-10 text-gray-400 text-[10px] uppercase tracking-[0.4em] font-black">Official Liaison System • KIMUN 2026</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#009EDB]/30">
      
      {/* 1. SECRETARIAT UTILITY BAR */}
      <div className="bg-[#333333] text-white py-1.5 px-8 text-[9px] uppercase font-black tracking-[0.3em] flex justify-between items-center">
        <div className="flex gap-8 items-center">
          <span className="flex items-center gap-2"><Globe2 size={10} className="text-[#009EDB]" /> Welcome to the KIMUN Secretariat</span>
          <div className="hidden lg:flex gap-6 border-l border-white/10 pl-6">
             <span className="cursor-pointer hover:text-[#009EDB] transition-colors">English</span>
             <span className="opacity-30 cursor-not-allowed">Français</span>
             <span className="opacity-30 cursor-not-allowed">Español</span>
             <span className="opacity-30 cursor-not-allowed">عربي</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 cursor-pointer hover:text-[#009EDB]">
              <Search size={10} />
              <span>Permanent Mission Index</span>
           </div>
        </div>
      </div>

      {/* 2. DIPLOMATIC NAVIGATION */}
      <nav className={`w-full z-[100] transition-all bg-white border-b border-gray-200 sticky top-0 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <img 
              src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" 
              alt="Official Emblem" 
              className="h-16 w-16 transition-transform hover:scale-105" 
            />
            <div className="border-l-2 border-gray-100 pl-6">
               <h1 className="text-xl font-black text-[#003366] leading-none uppercase tracking-tighter">United Nations</h1>
               <p className="text-[10px] font-black text-[#009EDB] uppercase tracking-[0.2em] mt-1">Kalinga International Model UN 2026</p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-10 text-[11px] font-black uppercase text-gray-500 tracking-widest">
            {["The Secretariat", "Accreditation", "Principal Organs", "Plenary Documents"].map(item => (
              <a key={item} href="#" className="hover:text-[#003366] relative group py-2">
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#009EDB] transition-all group-hover:w-full" />
              </a>
            ))}
            <a href="/registration">
                <Button size="sm">Request Credentials</Button>
            </a>
          </div>

          <button className="lg:hidden text-[#003366]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
             {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* 3. HERO: PLENARY SESSION OVERVIEW */}
      <section ref={refHero} className="relative bg-[#003366] text-white overflow-hidden border-b-8 border-[#009EDB]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2">
           <div className="p-12 lg:p-24 flex flex-col justify-center space-y-8 relative z-10 bg-[#003366]/90">
              <div className="flex items-center gap-3">
                 <span className="inline-block bg-[#009EDB] text-[9px] font-black px-4 py-1.5 uppercase tracking-[0.3em]">Session KIMUN/2026/01</span>
              </div>
              <h2 className="text-5xl lg:text-7xl font-black leading-[0.9] tracking-tighter uppercase">
                Multilateral <br/><span className="text-[#009EDB]">Discourse.</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-lg leading-relaxed font-light italic border-l-4 border-[#009EDB] pl-8">
                The Office of the Secretary-General officially convenes Member States for the 2026 Plenary in Bhubaneswar. Forging strategic alliances for intergovernmental cooperation and stability.
              </p>
              <div className="flex flex-wrap gap-6 pt-6">
                 <a href="/registration">
                    <Button size="lg">Apply for Accreditation</Button>
                 </a>
                 <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-[#003366]">Consult Charter</Button>
              </div>
           </div>
           <div className="relative min-h-[500px] lg:min-h-full">
              <img 
                src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/chatgpt-image-mar-29-2025-12_03_59-pm.png" 
                className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.4] contrast-125" 
                alt="Plenary Hall" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#003366] to-transparent lg:block hidden" />
              <div className="absolute bottom-12 right-12 text-right">
                  <p className="text-6xl font-black italic tracking-tighter text-white/20 uppercase">Bhubaneswar</p>
                  <p className="text-[12px] font-bold text-[#009EDB] uppercase tracking-[0.5em]">Liaison HQ 2026</p>
              </div>
           </div>
        </div>
      </section>

      {/* 4. OFFICIAL COMMUNIQUÉ */}
      <div className="bg-[#F8F9FA] border-b border-gray-200">
         <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
               <div className="p-3 bg-[#009EDB]/10 rounded-full text-[#009EDB]">
                  <AlertCircle size={24} />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-[#009EDB] uppercase tracking-widest">Secretariat Communiqué</p>
                  <span className="font-bold text-sm tracking-tight text-[#003366]">Official accreditation portal for institutional delegates and permanent missions is now operational.</span>
               </div>
            </div>
            <a href="/registration">
                <Button size="sm" variant="secondary" className="whitespace-nowrap px-8">Verify Diplomatic Status</Button>
            </a>
         </div>
      </div>

      {/* 5. PRINCIPAL ORGANS & SUBSIDIARY BODIES */}
      <section ref={refNews} className="py-32 max-w-7xl mx-auto px-8">
         <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-gray-50 pb-8 mb-16 gap-6">
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <Landmark size={20} className="text-[#009EDB]" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Governance Hierarchy</span>
               </div>
               <h3 className="text-4xl font-black text-[#003366] uppercase tracking-tighter leading-none">Intergovernmental <br/>Committees.</h3>
            </div>
            <a href="#" className="text-[11px] font-black text-[#009EDB] hover:text-[#003366] flex items-center gap-2 uppercase tracking-[0.2em] transition-colors">
               Full Subsidiary Body Registry <ChevronRight size={14} />
            </a>
         </div>

         {loading ? (
            <div className="flex flex-col items-center gap-8 py-32">
               <Loader2 className="animate-spin text-[#009EDB]" size={64} strokeWidth={4} />
               <span className="text-[12px] font-black text-gray-300 uppercase tracking-[0.5em]">Synchronizing Member State Registry...</span>
            </div>
         ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {committees.map((committee, idx) => (
                 <motion.div 
                    key={committee.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={inViewNews ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: idx * 0.08 }}
                    className="group border-2 border-gray-100 bg-white hover:border-[#009EDB] transition-all duration-500 shadow-sm flex flex-col"
                 >
                    <div className="h-64 bg-gray-200 relative overflow-hidden">
                       <img 
                          src={`https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&q=80`} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000 brightness-[0.35] grayscale" 
                          alt={committee.name}
                       />
                       <div className="absolute top-6 left-6 bg-[#003366] px-4 py-1.5 text-[10px] font-black text-white shadow-xl uppercase tracking-[0.2em]">
                          Organ Code: KIMUN/C-{idx + 1}
                       </div>
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                          <h4 className="text-2xl font-black text-white leading-tight uppercase tracking-tight group-hover:text-[#009EDB] transition-colors">{committee.name}</h4>
                       </div>
                    </div>
                    <div className="p-10 flex-1 flex flex-col">
                       <p className="text-sm text-gray-500 mb-10 flex-1 leading-loose font-light">
                          Mandated under the 2026 agenda to address systemic regional challenges and the codification of international legal frameworks.
                       </p>
                       <div className="flex justify-between items-center pt-8 border-t-2 border-gray-50">
                          <div className="flex items-center gap-3">
                             <div className={`h-2.5 w-2.5 rounded-full ${committee.portfolios?.some(p => p.isVacant) ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-gray-300'}`} />
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {committee.portfolios?.some(p => p.isVacant) ? "Open for Accreditation" : "Delegations Assigned"}
                             </span>
                          </div>
                          <a href="/matrix" className="text-[#009EDB] text-[11px] font-black uppercase hover:underline tracking-[0.1em]">View Matrix</a>
                       </div>
                    </div>
                 </motion.div>
              ))}
            </div>
         )}
      </section>

      {/* 6. DIPLOMATIC MISSION RESOURCES */}
      <section className="bg-[#003366] py-32 border-t-8 border-[#009EDB] relative overflow-hidden">
         <div className="absolute inset-0 opacity-5 grayscale brightness-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
         <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-20 text-center relative z-10">
            <div className="space-y-8">
               <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-[#009EDB] hover:scale-110 transition-transform cursor-pointer">
                  <FileText size={40} strokeWidth={1.5} />
               </div>
               <h5 className="font-black text-white uppercase tracking-tighter text-xl">Background Guides</h5>
               <p className="text-[11px] text-gray-400 leading-relaxed uppercase tracking-[0.2em] font-bold px-4">Standardized Rules of Procedure and Regional Security Frameworks.</p>
            </div>
            <div className="space-y-8">
               <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-[#009EDB] hover:scale-110 transition-transform cursor-pointer">
                  <Scale size={40} strokeWidth={1.5} />
               </div>
               <h5 className="font-black text-white uppercase tracking-tighter text-xl">Charter Compliance</h5>
               <p className="text-[11px] text-gray-400 leading-relaxed uppercase tracking-[0.2em] font-bold px-4">Codification of intergovernmental conduct and deliberation protocols.</p>
            </div>
            <div className="space-y-8">
               <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-[#009EDB] hover:scale-110 transition-transform cursor-pointer">
                  <Award size={40} strokeWidth={1.5} />
               </div>
               <h5 className="font-black text-white uppercase tracking-tighter text-xl">Diplomatic Citations</h5>
               <p className="text-[11px] text-gray-400 leading-relaxed uppercase tracking-[0.2em] font-bold px-4">Awards recognizing Excellence in Diplomacy and Policy Research.</p>
            </div>
         </div>
      </section>

      {/* 7. LIAISON OFFICE FOOTER */}
      <footer className="bg-[#1A1A1A] text-white pt-24 pb-12 px-8">
         <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-20 mb-24">
               <div className="col-span-2 space-y-10">
                  <div className="flex items-center gap-6">
                    <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Emblem" className="h-24 brightness-0 invert opacity-50" />
                    <div>
                       <h6 className="text-3xl font-black uppercase tracking-tighter leading-none">KIMUN Secretariat</h6>
                       <p className="text-[10px] text-[#009EDB] uppercase tracking-[0.5em] font-black mt-2">Bhubaneswar Mission System</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 max-w-md leading-loose font-light">
                     The Kalinga International Model United Nations is a formal institutional body established to simulate intergovernmental deliberation, adhering strictly to the procedures of the United Nations General Assembly.
                  </p>
               </div>
               <div>
                  <h6 className="text-[10px] font-black uppercase mb-10 border-b border-white/5 pb-4 tracking-[0.4em] text-[#009EDB]">Principal Registry</h6>
                  <ul className="text-[11px] space-y-5 text-gray-400 font-black uppercase tracking-[0.2em]">
                     <li className="hover:text-white cursor-pointer transition-colors">Study Guides</li>
                     <li className="hover:text-white cursor-pointer transition-colors">Liaison Procedures</li>
                     <li className="hover:text-white cursor-pointer transition-colors">Member State Index</li>
                     <li className="hover:text-white cursor-pointer transition-colors">Plenary Archives</li>
                  </ul>
               </div>
               <div>
                  <h6 className="text-[10px] font-black uppercase mb-10 border-b border-white/5 pb-4 tracking-[0.4em] text-[#009EDB]">Diplomatic HQ</h6>
                  <ul className="text-[11px] space-y-5 text-gray-400 font-black uppercase tracking-[0.2em]">
                     <li className="flex items-center gap-4 hover:text-white transition-colors"><MapPin size={14} className="text-[#009EDB]" /> Bhubaneswar, India</li>
                     <li className="flex items-center gap-4 hover:text-white transition-colors"><Globe size={14} className="text-[#009EDB]" /> secretariat@kimun.in.net</li>
                     <li className="flex items-center gap-4 hover:text-white transition-colors"><Briefcase size={14} className="text-[#009EDB]" /> Contact Mission</li>
                  </ul>
               </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center pt-16 border-t border-white/5 gap-10">
               <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
                  <span className="hover:text-white cursor-pointer transition-colors">Charter</span>
                  <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                  <span className="hover:text-white cursor-pointer transition-colors">Copyright</span>
               </div>
               <div className="flex items-center gap-4 text-[10px] font-black uppercase text-[#009EDB] tracking-[0.5em] bg-white/5 px-8 py-3 rounded-sm border border-white/5">
                  <ShieldCheck size={16} />
                  SECURED DIPLOMATIC PORTAL 2026
               </div>
            </div>
         </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;900&display=swap');
        
        body {
          background-color: #ffffff;
          margin: 0;
          padding: 0;
          font-family: 'Inter', sans-serif;
          color: #1A1A1A;
        }

        /* High-fidelity anti-aliasing */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
          background: #003366;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #009EDB;
        }
      `}</style>
    </div>
  )
}

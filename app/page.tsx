"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { 
  Calendar, ChevronRight, Globe, MapPin, Users, Loader2,
  Shield, Activity, Play, FileText, Search, ExternalLink,
  Info, AlertCircle, Menu, X, CheckCircle2, Award, Briefcase, Landmark
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

// --- UN Themed Components ---
const Button = React.forwardRef<HTMLButtonElement, any>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[#009EDB] text-white hover:bg-[#0077B3] shadow-sm",
    outline: "border border-[#009EDB] text-[#009EDB] hover:bg-[#F0F8FF]",
    secondary: "bg-[#4D4D4D] text-white hover:bg-[#333333]",
    ghost: "text-gray-600 hover:bg-gray-100"
  }
  const sizes = {
    default: "h-10 px-6 py-2",
    lg: "h-12 px-8 text-lg font-bold",
    sm: "h-8 px-4 text-xs"
  }
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-sans font-medium uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 ${variants[variant as keyof typeof variants] || variants.default} ${sizes[size as keyof typeof sizes] || sizes.default} ${className}`}
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

  // --- Formal Maintenance Mode ---
  if (underMaintenance) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-xl bg-white p-12 border border-gray-200 shadow-xl rounded-sm">
          <div className="w-20 h-20 bg-[#009EDB] text-white rounded-full flex items-center justify-center mx-auto mb-8">
            <Shield size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-tight">Official Notice: Protocol Suspension</h1>
          <p className="text-gray-600 mb-8 leading-relaxed text-sm">
            The Kalinga International Model United Nations Secretariat is currently performing an audit of the Accreditation & Liaison System. Access is restricted per Administrative Instruction KIMUN/AI/2026/01.
          </p>
          <div className="bg-gray-100 p-6 mb-8">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Estimated Restoration of Service</p>
            <div className="text-4xl font-mono font-bold text-[#009EDB]">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </div>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Retry Gateway Access
          </Button>
        </div>
        <p className="mt-8 text-gray-400 text-[10px] uppercase tracking-widest font-bold">© 2026 KIMUN Secretariat • Permanent Mission Info System</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#009EDB]/20">
      
      {/* 1. TOP UTILITY BAR: MEMBER STATE SELECTION */}
      <div className="bg-[#4D4D4D] text-white py-1 px-6 text-[10px] uppercase font-bold tracking-widest flex justify-between items-center">
        <div className="flex gap-6">
          <span>Official Portal of the KIMUN Secretariat</span>
          <div className="hidden md:flex gap-4 border-l border-white/20 pl-4">
             <span className="cursor-pointer hover:text-[#009EDB]">English</span>
             <span className="opacity-50 cursor-not-allowed">Français</span>
             <span className="opacity-50 cursor-not-allowed">Español</span>
             <span className="opacity-50 cursor-not-allowed">عربي</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <Search size={12} className="cursor-pointer" />
           <span className="cursor-pointer hover:text-[#009EDB]">Member State Index</span>
        </div>
      </div>

      {/* 2. MAIN NAV: INSTITUTIONAL HIERARCHY */}
      <nav className={`w-full z-[100] transition-all bg-white border-b border-gray-200 sticky top-0`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img 
              src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" 
              alt="KIMUN Emblem" 
              className="h-14 w-14" 
            />
            <div className="border-l border-gray-300 pl-4">
               <h1 className="text-lg font-bold text-[#003366] leading-none uppercase tracking-tight">KIMUN Secretariat</h1>
               <p className="text-[11px] font-bold text-[#009EDB] uppercase">Accreditation & Liaison Service 2026</p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-[12px] font-bold uppercase text-gray-600">
            {["Overview", "The Secretariat", "Accreditation", "Organs", "Documents"].map(item => (
              <a key={item} href="#" className="hover:text-[#009EDB] border-b-2 border-transparent hover:border-[#009EDB] pb-1 transition-all">{item}</a>
            ))}
            <Button size="sm">Submit Credentials</Button>
          </div>

          <button className="lg:hidden text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
             {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* 3. HERO SECTION: PLENARY THEME */}
      <section ref={refHero} className="relative bg-[#003366] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2">
           <div className="p-12 lg:p-24 flex flex-col justify-center space-y-6 relative z-10 bg-[#003366]/85">
              <span className="inline-block bg-[#009EDB] text-[10px] font-bold px-3 py-1 uppercase tracking-widest">Administrative Circular</span>
              <h2 className="text-4xl lg:text-6xl font-black leading-tight tracking-tight uppercase">
                Multilateralism for <span className="text-[#009EDB]">Global Cooperation</span>
              </h2>
              <p className="text-lg text-gray-200 max-w-lg leading-relaxed font-light">
                The Office of the Secretary-General invites all Member States to the 2026 Plenary Session in Bhubaneswar. Addressing systemic challenges through diplomatic discourse and collaborative resolution.
              </p>
              <div className="flex gap-4 pt-4">
                 <Button size="lg">Request Accreditation</Button>
                 <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-[#003366]">Consult Charter</Button>
              </div>
           </div>
           <div className="relative min-h-[400px] lg:min-h-full">
              <img 
                src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/chatgpt-image-mar-29-2025-12_03_59-pm.png" 
                className="absolute inset-0 w-full h-full object-cover grayscale-[30%] contrast-125" 
                alt="Plenary Session Hall" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#003366] to-transparent lg:block hidden" />
           </div>
        </div>
      </section>

      {/* 4. OFFICIAL ANNOUNCEMENT BAR */}
      <div className="bg-[#009EDB] text-white py-4 px-6 border-b border-[#0077B3]">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <AlertCircle size={20} className="flex-shrink-0" />
               <span className="font-bold text-sm tracking-tight">KIMUN/2026/CIRCULAR: The permanent portal for delegate accreditation and country preference is now live.</span>
            </div>
            <Button size="sm" variant="secondary" className="whitespace-nowrap text-[10px]">Verify Credentials</Button>
         </div>
      </div>

      {/* 5. PRINCIPAL ORGANS (COMMITTEES) */}
      <section ref={refNews} className="py-20 max-w-7xl mx-auto px-6">
         <div className="flex justify-between items-end border-b-2 border-gray-100 pb-6 mb-12">
            <div>
               <h3 className="text-2xl font-black text-[#003366] uppercase tracking-tighter">Intergovernmental Bodies</h3>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Sessions Convening in July 2026</p>
            </div>
            <a href="#" className="text-xs font-bold text-[#009EDB] hover:underline flex items-center gap-1 uppercase tracking-widest">
               Full Subsidiary Body List <ChevronRight size={14} />
            </a>
         </div>

         {loading ? (
            <div className="flex flex-col items-center gap-4 py-24">
               <Loader2 className="animate-spin text-[#009EDB]" size={48} strokeWidth={3} />
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Querying Member State Registry...</span>
            </div>
         ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {committees.map((committee, idx) => (
                 <motion.div 
                    key={committee.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={inViewNews ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-gray-200 bg-white flex flex-col group"
                 >
                    <div className="h-56 bg-gray-100 relative overflow-hidden">
                       <img 
                          src={`https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&q=80`} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000 brightness-75 grayscale-[20%]" 
                          alt={committee.name}
                       />
                       <div className="absolute top-4 left-4 bg-[#003366] px-3 py-1 text-[9px] font-bold text-white shadow-lg uppercase tracking-widest">
                          Organ Code: KIMUN/C-{idx + 1}
                       </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                       <h4 className="text-xl font-bold text-[#003366] mb-4 leading-tight uppercase tracking-tight">{committee.name}</h4>
                       <p className="text-sm text-gray-500 mb-8 flex-1 leading-relaxed font-light">
                          Mandated to address regional stability and the codification of international legal frameworks within the 2026 agenda.
                       </p>
                       <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                             <div className={`h-2 w-2 rounded-full ${committee.portfolios?.some(p => p.isVacant) ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                             <span className="text-[10px] font-bold text-gray-400 uppercase">
                                Allocation: {committee.portfolios?.some(p => p.isVacant) ? "Seats Available" : "Quorum Met"}
                             </span>
                          </div>
                          <a href="#" className="text-[#009EDB] text-[10px] font-bold uppercase hover:underline tracking-widest">Country Matrix</a>
                       </div>
                    </div>
                 </motion.div>
              ))}
            </div>
         )}
      </section>

      {/* 6. DIPLOMATIC RESOURCES */}
      <section className="bg-gray-50 py-24 border-t border-gray-200">
         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-16 text-center">
            <div className="space-y-6">
               <div className="w-20 h-20 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-auto text-[#003366] shadow-sm">
                  <FileText size={32} />
               </div>
               <h5 className="font-bold text-[#003366] uppercase tracking-tight">Background Documentation</h5>
               <p className="text-xs text-gray-600 leading-relaxed uppercase tracking-wider px-4">Rules of Procedure, Study Guides, and Position Paper Protocol.</p>
            </div>
            <div className="space-y-6">
               <div className="w-20 h-20 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-auto text-[#003366] shadow-sm">
                  <Globe size={32} />
               </div>
               <h5 className="font-bold text-[#003366] uppercase tracking-tight">Observer Accreditation</h5>
               <p className="text-xs text-gray-600 leading-relaxed uppercase tracking-wider px-4">Procedures for International Schools and Academic Missions.</p>
            </div>
            <div className="space-y-6">
               <div className="w-20 h-20 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-auto text-[#003366] shadow-sm">
                  <Award size={32} />
               </div>
               <h5 className="font-bold text-[#003366] uppercase tracking-tight">Citations of Merit</h5>
               <p className="text-xs text-gray-600 leading-relaxed uppercase tracking-wider px-4">Recognizing Excellence in Diplomacy and Deliberative Contribution.</p>
            </div>
         </div>
      </section>

      {/* 7. INSTITUTIONAL FOOTER */}
      <footer className="bg-[#003366] text-white pt-24 pb-12 px-6">
         <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-16 mb-24">
               <div className="col-span-2 space-y-8">
                  <div className="flex items-center gap-5">
                    <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Emblem" className="h-20 brightness-0 invert" />
                    <div>
                       <h6 className="text-2xl font-bold uppercase tracking-tighter">KIMUN Secretariat</h6>
                       <p className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-bold">Diplomatic Mission System</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 max-w-md leading-loose font-light">
                     The Kalinga International Model United Nations is an institutional forum established to facilitate the simulate work of the United Nations Organs, promoting the principles of the UN Charter among global youth.
                  </p>
               </div>
               <div>
                  <h6 className="text-xs font-bold uppercase mb-8 border-b border-white/10 pb-4 tracking-widest text-[#009EDB]">Official Registry</h6>
                  <ul className="text-[11px] space-y-4 text-gray-300 font-bold uppercase tracking-widest">
                     <li className="hover:text-white cursor-pointer flex items-center gap-2"><ChevronRight size={10} /> Background Guides</li>
                     <li className="hover:text-white cursor-pointer flex items-center gap-2"><ChevronRight size={10} /> Rules of Procedure</li>
                     <li className="hover:text-white cursor-pointer flex items-center gap-2"><ChevronRight size={10} /> Member State Index</li>
                     <li className="hover:text-white cursor-pointer flex items-center gap-2"><ChevronRight size={10} /> Plenary Archives</li>
                  </ul>
               </div>
               <div>
                  <h6 className="text-xs font-bold uppercase mb-8 border-b border-white/10 pb-4 tracking-widest text-[#009EDB]">Liaison Office</h6>
                  <ul className="text-[11px] space-y-4 text-gray-300 font-bold uppercase tracking-widest">
                     <li className="flex items-center gap-3"><MapPin size={14} className="text-[#009EDB]" /> Bhubaneswar, India</li>
                     <li className="flex items-center gap-3"><Globe size={14} className="text-[#009EDB]" /> secretariat@kimun.in.net</li>
                     <li className="flex items-center gap-3"><Briefcase size={14} className="text-[#009EDB]" /> +91 8249979557</li>
                  </ul>
               </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/10 gap-8">
               <div className="flex gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                  <span className="hover:text-white cursor-pointer">Copyright</span>
                  <span className="hover:text-white cursor-pointer">Terms of Use</span>
                  <span className="hover:text-white cursor-pointer">Privacy Protocol</span>
                  <span className="hover:text-white cursor-pointer">Security Warning</span>
               </div>
               <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-[#009EDB] tracking-[0.3em] bg-white/5 px-4 py-2 rounded-full">
                  <ShieldCheck size={14} />
                  Official Permanent Mission Records 2026
               </div>
            </div>
         </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
        
        body {
          background-color: #ffffff;
          margin: 0;
          padding: 0;
          font-family: 'Roboto', sans-serif;
          color: #333;
        }

        h1, h2, h3, h4, h5, h6 {
           font-family: 'Roboto', sans-serif;
           font-weight: 700;
        }

        .shadow-sm {
           box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        /* Institutional smoothing */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  )
}

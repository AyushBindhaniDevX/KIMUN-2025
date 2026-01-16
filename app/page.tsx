"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { 
  Calendar, ChevronRight, Globe, MapPin, Sparkles, Star, Users, Loader2,
  Zap, Shield, Fingerprint, Activity, ShieldCheck, Play, Mic, MicOff, LogOut,
  ArrowRight, Ticket, Menu, X
} from "lucide-react"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, get, set } from "firebase/database"

// --- Firebase configuration (Using your provided MUN config) ---
const firebaseConfig = {
  apiKey: "", // Left empty for runtime environment injection
  authDomain: "kimun-2025.firebaseapp.com",
  databaseURL: "https://kimun-2025-default-rtdb.firebaseio.com",
  projectId: "kimun-2025",
  storageBucket: "kimun-2025.appspot.com",
  messagingSenderId: "367175515228",
  appId: "1:367175515228:web:7586526e0310245037233a"
}

// --- Components ---
const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-white text-black hover:bg-violet-600 hover:text-white shadow-xl shadow-violet-500/10",
    outline: "border border-white/10 bg-white/5 text-white hover:bg-white hover:text-black",
    ghost: "text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10",
    secondary: "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/20"
  }
  const sizes = {
    default: "h-12 px-6",
    lg: "h-16 px-10 text-lg",
    icon: "h-10 w-10 p-0"
  }
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50 ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`}
      {...props}
    />
  )
})
Button.displayName = "Button"

const sponsors = [
  {
    name: "Venue Partner",
    tier: "gold",
    logos: [{ url: "https://www.asbm.ac.in/wp-content/uploads/2021/02/FINAL-LOGO-1.png", alt: "ASBMU", website: "https://www.asbm.ac.in" }]
  },
  {
    name: "Coupon Partner",
    tier: "silver",
    logos: [
      { url: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/320px-Starbucks_Corporation_Logo_2011.svg.png", alt: "STBK", website: "https://www.starbucks.in" },
      { url: "https://kimun497636615.wordpress.com/wp-content/uploads/2025/05/gali-no.-19-logo.png", alt: "G19", website: "https://www.instagram.com/galino19_bbsr/" }
    ]
  }
]

export default function App() {
  const [isMounted, setIsMounted] = useState(false)
  const [committees, setCommittees] = useState([])
  const [loading, setLoading] = useState(true)
  const [underMaintenance, setUnderMaintenance] = useState(false)
  const [countdown, setCountdown] = useState(600)
  const [scrolled, setScrolled] = useState(false)

  const { scrollY } = useScroll()
  const yHero = useTransform(scrollY, [0, 500], [0, 150])

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
        
        if (!maintenanceSnapshot.exists()) {
          await set(maintenanceRef, { enabled: false })
          setUnderMaintenance(false)
        } else {
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

        if (!underMaintenance) {
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
        }
        setLoading(false)
      } catch (err) {
        console.error("Sync Error:", err)
        setLoading(false)
      }
    }
    fetchData()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [underMaintenance])

  if (!isMounted) return null

  // --- Maintenance Mode (VYBB Style) ---
  if (underMaintenance) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-600/10 blur-[140px] rounded-full animate-pulse" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 space-y-8">
          <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Logo" className="w-[100px] h-[100px] mx-auto grayscale" />
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none">
            Registry <br/><span className="text-rose-500">Locked.</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Scheduled Maintenance Protocol</p>
          <div className="p-12 rounded-[3rem] bg-zinc-950 border border-white/5 shadow-2xl">
            <div className="text-5xl font-mono font-black italic text-white mb-4">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </div>
            <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Automatic Sync In Progress</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" className="px-12">MANUAL REFRESH</Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-violet-500/30 overflow-x-hidden font-sans">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 px-6 ${scrolled ? 'py-4 bg-black/60 backdrop-blur-2xl border-b border-white/5' : 'py-8'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="/" className="flex items-center gap-3">
             <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Logo" className="w-8 h-8" />
             <div className="text-xl font-black italic tracking-tighter uppercase">KIMUN <span className="text-violet-500">2025</span></div>
          </a>
          <div className="hidden md:flex items-center gap-10 text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500">
            {["About", "Registration", "Matrix", "Resources", "Committees"].map(item => (
              <a key={item} href={`/${item.toLowerCase()}`} className="hover:text-white transition-colors">{item}</a>
            ))}
          </div>
          <a href="/registration">
            <Button className="rounded-xl h-10 text-[9px]">INITIALIZE ACCESS</Button>
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center pt-20">
        <motion.div style={{ y: yHero }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] z-10" />
          <img
            src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/chatgpt-image-mar-29-2025-12_03_59-pm.png"
            alt="Background" className="w-full h-full object-cover opacity-20 grayscale"
          />
        </motion.div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl space-y-12">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="inline-block px-6 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 text-[9px] font-black uppercase tracking-[0.4em] text-violet-400 mb-8 backdrop-blur-xl">
                <Activity className="inline-block h-3 w-3 mr-3" /> Diplomacy Protocol v1.0
              </span>
              <h1 className="text-7xl md:text-[10rem] font-black italic tracking-tighter uppercase leading-[0.8] mb-12">
                KALINGA <br />
                <span className="bg-gradient-to-r from-violet-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">INTERNATIONAL.</span>
              </h1>
              <div className="flex flex-col md:flex-row items-end gap-8">
                <p className="text-xl md:text-2xl text-zinc-500 max-w-xl font-medium lowercase border-l-2 border-violet-500/30 pl-8 text-left leading-relaxed">
                  The debonair personification of international diplomacy. Transcending academia into pertinent leadership loops.
                </p>
                <div className="text-right flex-1 hidden md:block">
                  <p className="text-5xl font-black italic tracking-tighter text-white">05-06 JULY</p>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">BHUBANESWAR REGISTRY</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex gap-6">
              <a href="/registration">
                <Button size="lg" className="group h-20 px-12">
                  Initialize Registration <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="py-20 bg-black overflow-hidden border-y border-white/5">
        <motion.div 
          animate={{ x: [0, -2000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-20 whitespace-nowrap"
        >
          {Array(10).fill(["DIPLOMACY", "LEADERSHIP", "GLOBAL ISSUES", "DEBATE", "NETWORKING"]).flat().map((word, i) => (
            <span key={i} className="text-8xl font-black italic tracking-tighter uppercase text-zinc-900 hover:text-violet-500 transition-colors cursor-default select-none">
              {word}
            </span>
          ))}
        </motion.div>
      </section>

      {/* STATUS BANNER */}
      <section className="py-24 bg-zinc-950/50">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex flex-col items-center">
             <div className="flex items-center gap-3 mb-4">
                <div className={`h-2 w-2 rounded-full ${loading ? 'bg-zinc-700' : 'bg-emerald-500 animate-pulse'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">System Status</span>
             </div>
             <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-center">
                {loading ? "SYNCING..." : (
                  committees.some(c => c.portfolios.some(p => p.isVacant)) 
                  ? <span className="text-emerald-500">Registration Loop: Open</span>
                  : <span className="text-rose-500">Registry: Locked</span>
                )}
             </h2>
          </div>
        </div>
      </section>

      {/* INTEL SECTION (ABOUT) */}
      <section className="py-40 relative">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
             <div className="space-y-12">
                <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">The Intel <br/><span className="text-violet-500">Protocol.</span></h2>
                <p className="text-zinc-500 text-lg lowercase leading-relaxed border-l-2 border-violet-500/20 pl-8">
                  Kalinga International MUN is back with its inaugural installment. A two-day intensive loop designed for delegates vying for meaningful deliberation and kinetic leadership growth.
                </p>
                <div className="grid grid-cols-2 gap-6">
                   {[
                     { label: "Duration", val: "48 Hours", icon: Calendar },
                     { label: "Registry", val: "300+ Minds", icon: Users },
                     { label: "Committees", val: "07 Circles", icon: Globe },
                     { label: "Arena", val: "ASBMU Hub", icon: MapPin }
                   ].map((item, i) => (
                     <div key={i} className="p-6 rounded-3xl bg-zinc-950 border border-white/5 space-y-3">
                        <item.icon className="h-5 w-5 text-violet-500" />
                        <p className="text-xl font-black italic uppercase tracking-tight">{item.val}</p>
                        <p className="text-[8px] font-black uppercase text-zinc-700 tracking-widest">{item.label}</p>
                     </div>
                   ))}
                </div>
             </div>
             <div className="relative group">
                <div className="absolute inset-0 bg-violet-600/10 blur-[100px] rounded-full group-hover:bg-violet-600/20 transition-all" />
                <div className="relative rounded-[3.5rem] overflow-hidden border border-white/10 aspect-video grayscale group-hover:grayscale-0 transition-all duration-700">
                  <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/chatgpt-image-mar-29-2025-08_39_55-pm.png" alt="Intel" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-8 -right-8 h-24 w-24 bg-violet-600 rounded-[2rem] flex items-center justify-center shadow-3xl">
                   <ShieldCheck className="text-white h-10 w-10" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* COMMITTEE REGISTRY */}
      <section className="py-40 bg-zinc-950/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-4">The <span className="text-violet-500">Registry.</span></h2>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Authorized Committee Loops</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-6 py-20">
               <Zap className="h-10 w-10 text-violet-500 animate-pulse fill-current" />
               <span className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-800">Synchronizing Database...</span>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {committees.map((committee, idx) => {
                const vacant = committee.portfolios ? committee.portfolios.filter(p => p.isVacant).length : 0
                const total = committee.portfolios ? committee.portfolios.length : 1
                return (
                  <motion.div 
                    key={committee.id}
                    whileHover={{ y: -10 }}
                    className="group p-8 rounded-[3rem] bg-zinc-950 border border-white/5 hover:border-violet-500/20 transition-all shadow-3xl relative overflow-hidden text-left"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Ticket size={80} className="text-violet-500" />
                    </div>
                    <Badge className="bg-violet-600/10 text-violet-500 border-none text-[8px] font-black mb-6">COMMITTEE {idx + 1}</Badge>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 leading-none">{committee.name}</h3>
                    <div className="space-y-4 pt-4 border-t border-white/5">
                       <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-zinc-600">
                          <span>Portfolio Pool</span>
                          <span className="text-white">{vacant} / {total} Vacant</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${((total - vacant) / total) * 100}%` }}
                            className="h-full bg-violet-600" 
                          />
                       </div>
                    </div>
                    <a href="/matrix" className="inline-block mt-8">
                       <Button variant="outline" className="rounded-xl h-10 px-6">Inspect Matrix</Button>
                    </a>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* PARTNERS */}
      <section className="py-40">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-center mb-24 opacity-20 hover:opacity-100 transition-opacity duration-700">Official Partners.</h2>
          <div className="space-y-24">
            {sponsors.map(tier => (
              <div key={tier.name} className="flex flex-wrap justify-center items-center gap-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                {tier.logos.map(logo => (
                  <a key={logo.alt} href={logo.website} target="_blank" rel="noreferrer" className="block max-w-[200px]">
                    <img src={logo.url} alt={logo.alt} className="w-full h-auto object-contain" />
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-40 bg-black border-t border-white/5">
         <div className="container mx-auto px-6 text-center space-y-20">
            <div className="space-y-12">
               <h2 className="text-6xl md:text-[9rem] font-black italic uppercase tracking-tighter leading-none">JOIN THE <br/><span className="text-violet-500">CIRCLE.</span></h2>
               <div className="flex flex-wrap justify-center gap-6">
                  <a href="/registration"><Button size="lg" className="h-20 px-16 text-xl">Initialize Registration</a >
                  <a href="mailto:info@kimun.in.net"><Button variant="outline" size="lg" className="h-20 px-16 text-xl">Inquire Protocol</Button></a>
               </div>
            </div>
            
            <div className="grid md:grid-cols-3 items-center gap-12 pt-20 border-t border-white/5">
              <div className="text-2xl font-black italic uppercase tracking-tighter text-left">KIMUN <span className="text-violet-500">2025</span></div>
              <div className="flex justify-center gap-10 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">
                 <a href="/about" className="hover:text-white">Registry</a>
                 <a href="/registration" className="hover:text-white">Access</a>
                 <a href="/matrix" className="hover:text-white">The Matrix</a>
              </div>
              <div className="text-right text-[10px] font-black text-zinc-800 uppercase tracking-widest">© 2026 Protocol Secured.</div>
            </div>
         </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,900;1,900&display=swap');
        
        body {
          background-color: #050505;
          margin: 0;
          padding: 0;
          font-family: 'Inter', sans-serif;
        }

        /* Smoothing for heavy font weights */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  )
}

function Badge({ children, className }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${className}`}>
      {children}
    </span>
  )
}

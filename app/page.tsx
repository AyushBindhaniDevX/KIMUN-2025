"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { 
  Calendar, ChevronRight, Globe, MapPin, Sparkles, Star, Users, Loader2,
  Zap, Shield, Fingerprint, Activity, ShieldCheck, Play, Mic, MicOff, LogOut,
  ArrowRight, Ticket, Menu, X, Ghost, Flame, Radio, ZapOff, AlertTriangle
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
  isDoubleDelAllowed: boolean;
  isVacant: boolean;
  minExperience: number;
}

interface Committee {
  id: string;
  name: string;
  emoji: string;
  portfolios: Portfolio[];
}

// --- Stranger Things Components ---
const Button = React.forwardRef<HTMLButtonElement, any>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[#e31b23] text-white hover:bg-white hover:text-black shadow-[0_0_25px_rgba(227,27,35,0.7)] border-none",
    outline: "border-2 border-[#e31b23] bg-transparent text-[#e31b23] hover:bg-[#e31b23] hover:text-white shadow-[inset_0_0_10px_rgba(227,27,35,0.2)]",
    ghost: "text-zinc-500 hover:text-[#e31b23] hover:bg-[#e31b23]/10",
    secondary: "bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700"
  }
  const sizes = {
    default: "h-12 px-6",
    lg: "h-16 px-10 text-xl",
    icon: "h-10 w-10 p-0"
  }
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-serif font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 hover:skew-x-[-3deg] ${variants[variant as keyof typeof variants] || variants.default} ${sizes[size as keyof typeof sizes] || sizes.default} ${className}`}
      {...props}
    />
  )
})
Button.displayName = "Button"

const sponsors = [
  {
    name: "Laboratory Partner",
    tier: "gold",
    logos: [{ url: "https://www.asbm.ac.in/wp-content/uploads/2021/02/FINAL-LOGO-1.png", alt: "ASBMU", website: "https://www.asbm.ac.in" }]
  },
  {
    name: "Survival Supplies",
    tier: "silver",
    logos: [
      { url: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/320px-Starbucks_Corporation_Logo_2011.svg.png", alt: "STBK", website: "https://www.starbucks.in" },
      { url: "https://kimun497636615.wordpress.com/wp-content/uploads/2025/05/gali-no.-19-logo.png", alt: "G19", website: "https://www.instagram.com/galino19_bbsr/" }
    ]
  }
]

export default function App() {
  const [isMounted, setIsMounted] = useState(false)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [underMaintenance, setUnderMaintenance] = useState(false)
  const [countdown, setCountdown] = useState(600)
  const [scrolled, setScrolled] = useState(false)

  const { scrollY } = useScroll()
  const yHero = useTransform(scrollY, [0, 500], [0, 100])
  const heroBlur = useTransform(scrollY, [0, 300], [0, 12])

  const [refIntel, inViewIntel] = useInView({ threshold: 0.1, triggerOnce: true })
  const [refRegistry, inViewRegistry] = useInView({ threshold: 0.1, triggerOnce: true })

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

  // --- Maintenance Mode: The Void ---
  if (underMaintenance) {
    return (
      <div className="min-h-screen bg-[#020202] text-[#e31b23] flex flex-col items-center justify-center p-6 text-center font-serif overflow-hidden">
        <div className="crt-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(227,27,35,0.15),transparent_80%)]" />
        <div className="upside-down-particles absolute inset-0 opacity-40 pointer-events-none" />
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 space-y-10">
          <ZapOff className="h-20 w-20 mx-auto animate-flicker" />
          <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter glow-red title-glitch" data-text="LOCKED">
            LOCKED
          </h1>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-[0.6em] animate-pulse">Breach Detected in Sector 7</p>
          <div className="p-16 border-2 border-[#e31b23] bg-black/60 backdrop-blur-xl shadow-[0_0_50px_rgba(227,27,35,0.3)]">
            <div className="text-7xl font-mono font-black glow-red">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </div>
            <p className="text-zinc-500 text-xs uppercase mt-6 tracking-[0.3em]">Protocol Resets in T-Minus</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" className="px-16 py-8">OVERRIDE ENCRYPTION</Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-[#e31b23]/30 overflow-x-hidden font-serif relative">
      
      {/* GLOBAL THEME OVERLAYS */}
      <div className="crt-overlay pointer-events-none z-[1000]" />
      <div className="fixed inset-0 pointer-events-none z-[50] mix-blend-screen opacity-20 upside-down-particles" />
      <div className="fixed inset-0 pointer-events-none z-[1] bg-[radial-gradient(circle_at_top,rgba(227,27,35,0.08),transparent_70%)]" />

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-700 px-6 ${scrolled ? 'py-4 bg-black/95 backdrop-blur-2xl border-b border-[#e31b23]/40 shadow-[0_0_30px_rgba(227,27,35,0.25)]' : 'py-10'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="/" className="flex items-center gap-4 group">
             <div className="relative">
                <Radio className="h-8 w-8 text-[#e31b23] group-hover:animate-flicker relative z-10" />
                <div className="absolute inset-0 bg-[#e31b23] blur-lg opacity-40 animate-pulse" />
             </div>
             <div className="text-3xl font-black tracking-tighter uppercase glow-red-text">KIMUN <span className="text-[#e31b23]">1986</span></div>
          </a>
          <div className="hidden lg:flex items-center gap-12 text-[12px] font-black uppercase tracking-[0.4em] text-zinc-500">
            {["About", "Coming Soon", "Matrix", "Resources", "Archives"].map(item => (
              <a key={item} href="#" className="hover:text-[#e31b23] hover:glow-red-text transition-all duration-300 relative group">
                {item}
                <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-[#e31b23] transition-all group-hover:w-full shadow-[0_0_8px_#e31b23]" />
              </a>
            ))}
          </div>
          <a href="#">
            <Button size="default" className="rounded-none border-t border-b border-[#e31b23]/50 px-8">PROJECT 2026</Button>
          </a>
        </div>
      </nav>

      {/* HERO SECTION: THE GATE */}
      <section className="relative h-screen flex items-center pt-20 overflow-hidden">
        <motion.div style={{ y: yHero, filter: `blur(${heroBlur}px)` }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-transparent to-[#020202] z-10" />
          <img
            src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/chatgpt-image-mar-29-2025-12_03_59-pm.png"
            alt="The Upside Down" className="w-full h-full object-cover opacity-25 grayscale brightness-[0.3] contrast-125"
          />
        </motion.div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl space-y-10">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.2 }}>
              <span className="inline-block px-6 py-2 border-2 border-[#e31b23] bg-[#e31b23]/10 text-[11px] font-black uppercase tracking-[0.5em] text-[#e31b23] mb-12 shadow-[0_0_15px_rgba(227,27,35,0.4)] animate-flicker">
                <AlertTriangle className="inline-block h-4 w-4 mr-3" /> INITIALIZING PHASE II // SECTOR 2026
              </span>
              <h1 className="text-7xl md:text-[11rem] font-black tracking-[ -0.05em] uppercase leading-[0.75] mb-16 glow-red-text title-glitch select-none" data-text="KALINGA">
                KALINGA <br />
                <span className="text-[#e31b23] opacity-90">INTERNATIONAL.</span>
              </h1>
              <div className="flex flex-col md:flex-row items-start md:items-end gap-12">
                <div className="relative group max-w-xl">
                    <p className="text-2xl md:text-3xl text-zinc-400 italic border-l-8 border-[#e31b23] pl-10 text-left leading-relaxed py-2">
                      Something is coming. Something hungry for diplomacy. 48 hours to save the world, one resolution at a time.
                    </p>
                    <div className="absolute -left-2 top-0 h-full w-2 bg-[#e31b23] blur-sm opacity-50" />
                </div>
                <div className="text-right flex-1 hidden md:block">
                  <p className="text-7xl font-black text-white tracking-tighter glow-red-text">2026</p>
                  <p className="text-[14px] font-black text-[#e31b23] uppercase tracking-[0.6em] mt-2">HAWKINS • BHUBANESWAR</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="flex flex-wrap gap-8 pt-10">
              <a href="#">
                <Button size="lg" className="px-20 py-10 text-2xl group relative overflow-hidden">
                   <span className="relative z-10 flex items-center">INITIALIZE LOOP <ArrowRight className="ml-4 h-8 w-8 group-hover:translate-x-3 transition-transform" /></span>
                   <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                </Button>
              </a>
              <a href="#">
                <Button variant="outline" size="lg" className="px-16 border-zinc-800 text-zinc-500 hover:border-[#e31b23]">
                   DECRYPT INTEL
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MARQUEE: THE PULSE */}
      <section className="py-20 bg-black overflow-hidden border-y-2 border-[#e31b23]/30">
        <motion.div 
          animate={{ x: [0, -2500] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="flex gap-24 whitespace-nowrap"
        >
          {Array(10).fill(["RUN", "DIPLOMACY", "SURVIVE", "THE GATE", "EGGOS", "HAWKINS LABORATORY", "PROJECT 2026"]).flat().map((word, i) => (
            <span key={i} className="text-7xl md:text-9xl font-black uppercase text-zinc-900/40 hover:text-[#e31b23] hover:glow-red-text transition-all duration-500 cursor-default select-none skew-x-[-10deg]">
              {word}
            </span>
          ))}
        </motion.div>
      </section>

      {/* STATUS: COMING SOON PROTOCOL */}
      <section className="py-32 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} className="inline-flex flex-col items-center">
             <div className="flex items-center gap-4 mb-8">
                <div className="h-3 w-3 rounded-full bg-[#e31b23] animate-flicker shadow-[0_0_15px_#e31b23]" />
                <span className="text-[13px] font-black uppercase tracking-[0.5em] text-[#e31b23]">Classified Frequency</span>
             </div>
             <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-center glow-red-text leading-none mb-4">
                COMMING SOON.
             </h2>
             <p className="text-zinc-600 font-mono text-sm uppercase tracking-[0.4em]">Establishing Secure Gateway Connection for 2026</p>
          </motion.div>
        </div>
      </section>

      {/* INTEL: SUBJECT DOSSIER */}
      <section ref={refIntel} className="py-48 relative overflow-hidden border-b border-zinc-900">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
             <motion.div 
                initial={{ opacity: 0, x: -50 }} 
                animate={inViewIntel ? { opacity: 1, x: 0 } : {}}
                className="space-y-16"
              >
                <div className="space-y-4">
                    <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] glow-red-text">SUBJECT <br/><span className="text-[#e31b23]">DOSSIER.</span></h2>
                    <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.5em] mt-4">KIMUN // DIVISION 1986</p>
                </div>
                <p className="text-zinc-400 text-2xl italic leading-relaxed border-l-8 border-[#e31b23] pl-12 py-4">
                  The gates have been closed for a year. But the shadow is growing. 2026 marks the return of the Kalinga International Registry. This is not a simulation. 
                </p>
                <div className="grid grid-cols-2 gap-10">
                   {[
                     { label: "Temporal Loop", val: "48 Hours", icon: Radio },
                     { label: "Verified Subjects", val: "300+ Minds", icon: Users },
                     { label: "File Divisions", val: "07 Circles", icon: Globe },
                     { label: "Primary Hub", val: "Secret Site", icon: MapPin }
                   ].map((item, i) => (
                     <div key={i} className="p-8 bg-black border-2 border-zinc-900 hover:border-[#e31b23] transition-all duration-500 group relative">
                        <div className="absolute top-0 left-0 w-1 h-0 bg-[#e31b23] group-hover:h-full transition-all duration-500" />
                        <item.icon className="h-7 w-7 text-[#e31b23] group-hover:animate-bounce mb-4" />
                        <p className="text-2xl font-black uppercase tracking-tight">{item.val}</p>
                        <p className="text-[11px] font-bold uppercase text-zinc-600 tracking-[0.3em] mt-2">{item.label}</p>
                     </div>
                   ))}
                </div>
             </motion.div>
             <div className="relative group">
                <div className="absolute inset-0 bg-[#e31b23]/15 blur-[120px] rounded-full group-hover:bg-[#e31b23]/25 transition-all" />
                <div className="relative border-8 border-zinc-900 aspect-square md:aspect-video grayscale contrast-150 brightness-50 group-hover:brightness-90 transition-all duration-1000 shadow-2xl">
                  <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/chatgpt-image-mar-29-2025-08_39_55-pm.png" alt="Lab Entry" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#e31b23]/10 mix-blend-overlay" />
                </div>
                <div className="absolute -bottom-12 -right-12 h-32 w-32 bg-[#e31b23] flex items-center justify-center shadow-[0_0_60px_#e31b23] animate-pulse z-20">
                   <ShieldCheck className="text-white h-14 w-14" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* COMMITTEE REGISTRY: RESTRICTED ACCESS */}
      <section ref={refRegistry} className="py-48 bg-[#030303] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20 upside-down-particles" />
        <div className="container mx-auto px-6">
          <div className="text-center mb-32">
            <h2 className="text-7xl md:text-9xl font-black uppercase tracking-tighter mb-6 glow-red-text title-glitch" data-text="REGISTRY">THE REGISTRY.</h2>
            <p className="text-[#e31b23] font-mono text-sm uppercase tracking-[0.8em] animate-pulse">CLASSIFIED ACCESS ONLY</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
            {committees.length > 0 ? committees.map((committee, idx) => (
                <motion.div 
                    key={committee.id}
                    whileHover={{ y: -15, scale: 1.03 }}
                    className="group p-10 bg-black border-2 border-zinc-900 hover:border-[#e31b23] transition-all duration-500 shadow-2xl relative overflow-hidden text-left"
                >
                    <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-20 transition-all duration-700">
                        <Flame size={200} className="text-[#e31b23]" />
                    </div>
                    <Badge className="bg-[#e31b23]/10 text-[#e31b23] border border-[#e31b23]/40 text-[12px] font-black mb-8 px-4">FILE NO. {idx + 86}</Badge>
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-6 leading-[0.9] glow-red-text group-hover:text-white transition-colors">{committee.name}</h3>
                    <div className="space-y-6 pt-6 border-t border-zinc-900">
                       <div className="flex justify-between items-center font-mono text-xs uppercase tracking-widest text-zinc-500">
                          <span>Gateway Integrity</span>
                          <span className="text-[#e31b23] animate-pulse">ENCRYPTED</span>
                       </div>
                       <div className="h-2 w-full bg-zinc-900 rounded-none overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                          <motion.div initial={{ width: "0%" }} whileInView={{ width: "35%" }} className="h-full bg-[#e31b23] shadow-[0_0_20px_#e31b23]" />
                       </div>
                    </div>
                    <Button variant="ghost" className="mt-12 w-full border border-zinc-900 hover:border-[#e31b23] text-zinc-700">LOCKED FOR 2026</Button>
                </motion.div>
            )) : (
                Array(3).fill(0).map((_, i) => (
                    <div key={i} className="p-12 bg-black border-2 border-zinc-900 animate-pulse">
                        <div className="h-4 w-24 bg-zinc-800 mb-6" />
                        <div className="h-12 w-full bg-zinc-800 mb-8" />
                        <div className="h-2 w-full bg-zinc-800" />
                    </div>
                ))
            )}
          </div>
        </div>
      </section>

      {/* FOOTER: THE END OF THE LOOP */}
      <footer className="py-48 bg-black border-t-4 border-[#e31b23] relative">
         <div className="absolute top-0 left-0 w-full h-1 bg-[#e31b23] blur-md shadow-[0_0_20px_#e31b23]" />
         <div className="container mx-auto px-6 text-center space-y-24">
            <div className="space-y-16">
               <h2 className="text-7xl md:text-[13rem] font-black uppercase tracking-tighter leading-none glow-red-text animate-flicker">JOIN US.</h2>
               <div className="flex flex-wrap justify-center gap-12">
                  <a href="#">
                    <Button size="lg" className="px-24 py-12 text-3xl shadow-[0_0_40px_rgba(227,27,35,0.6)] animate-pulse">
                      OVERRIDE 2026
                    </Button>
                  </a>
               </div>
            </div>
            
            <div className="grid md:grid-cols-3 items-center gap-20 pt-24 border-t-2 border-zinc-900">
              <div className="text-3xl font-black tracking-tighter text-left glow-red-text">KIMUN <span className="text-[#e31b23]">1986</span></div>
              <div className="flex justify-center gap-12 text-[12px] font-black uppercase tracking-[0.5em] text-zinc-600">
                 <a href="#" className="hover:text-[#e31b23] transition-all">Intel</a>
                 <a href="#" className="hover:text-[#e31b23] transition-all">Gate</a>
                 <a href="#" className="hover:text-[#e31b23] transition-all">Dossier</a>
              </div>
              <div className="text-right text-[12px] font-black text-zinc-800 uppercase tracking-widest">© 1986 Sector 4 Protocols Locked.</div>
            </div>
         </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap');
        
        body {
          background-color: #020202;
          margin: 0;
          padding: 0;
          font-family: 'EB Garamond', serif;
          overflow-x: hidden;
          color: white;
        }

        .crt-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
          background-size: 100% 4px, 3px 100%;
          z-index: 9999;
          pointer-events: none;
        }

        .glow-red {
          text-shadow: 0 0 25px rgba(227,27,35,0.9), 0 0 50px rgba(227,27,35,0.5);
        }

        .glow-red-text {
          text-shadow: 0 0 15px rgba(227,27,35,0.8);
        }

        @keyframes flicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; filter: drop-shadow(0 0 10px #e31b23); }
          20%, 22%, 24%, 55% { opacity: 0.3; filter: none; }
        }

        .animate-flicker {
          animation: flicker 5s infinite;
        }

        .upside-down-particles {
          background-image: url('https://www.transparenttextures.com/patterns/stardust.png');
          animation: particle-float 30s linear infinite;
        }

        @keyframes particle-float {
          0% { background-position: 0 0; }
          100% { background-position: 1000px 1000px; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .title-glitch {
          position: relative;
        }

        .title-glitch::before,
        .title-glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.8;
        }

        .title-glitch::before {
          color: #e31b23;
          z-index: -1;
          animation: glitch-anim 3s infinite linear alternate-reverse;
          clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
        }

        @keyframes glitch-anim {
          0% { transform: translate(0); }
          20% { transform: translate(-3px, 3px); }
          40% { transform: translate(-3px, -3px); }
          60% { transform: translate(3px, 3px); }
          80% { transform: translate(3px, -3px); }
          100% { transform: translate(0); }
        }

        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .title-glitch::before, .title-glitch::after { display: none; }
        }
      `}</style>
    </div>
  )
}

function Badge({ children, className }: any) {
  return (
    <span className={`inline-block px-3 py-1 text-[12px] font-black tracking-[0.2em] uppercase ${className}`}>
      {children}
    </span>
  )
}

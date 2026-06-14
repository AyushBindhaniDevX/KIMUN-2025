"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronRight, Globe, MapPin, Sparkles, Star, Users, Loader2 } from "lucide-react"
import MobileNav from "@/components/mobile-nav"
import ParallaxText from "@/components/parallax-text"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, get, set } from "firebase/database"

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

type Committee = {
  id: string
  name: string
  emoji: string
  portfolios: Portfolio[]
}

type Portfolio = {
  id: string
  country: string
  countryCode: string
  isDoubleDelAllowed: boolean
  isVacant: boolean
  minExperience: number
}

const sponsors = [
  {
    name: "Venue Partner",
    tier: "gold",
    logos: [
      { 
        url: "https://www.asbm.ac.in/wp-content/uploads/2021/02/FINAL-LOGO-1.png", 
        alt: "ASBMU",
        website: "https://www.asbm.ac.in" 
      }
    ]
  },
  {
    name: "Coupon Partner",
    tier: "silver",
    logos: [
      { 
        url: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/320px-Starbucks_Corporation_Logo_2011.svg.png", 
        alt: "STBK",
        website: "https://www.starbucks.in" 
      },
      { 
        url: "https://kimun497636615.wordpress.com/wp-content/uploads/2025/05/gali-no.-19-logo.png", 
        alt: "G19",
        website: "https://www.instagram.com/galino19_bbsr/" 
      }
    ]
  }
];

export default function Home() {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 60])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  const [isMounted, setIsMounted] = useState(false)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [underMaintenance, setUnderMaintenance] = useState(false)
  const [countdown, setCountdown] = useState(600)
  const [siteSettings, setSiteSettings] = useState<any>(null)

  const [ref1, inView1] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [ref2, inView2] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [ref3, inView3] = useInView({ triggerOnce: true, threshold: 0.1 })

  useEffect(() => {
    setIsMounted(true)
    
    const fetchData = async () => {
      try {
        const app = initializeApp(firebaseConfig)
        const db = getDatabase(app)
        
        const siteSettingsRef = ref(db, 'site_settings')
        const siteSettingsSnapshot = await get(siteSettingsRef)
        
        let maintenanceEnabled = false
        if (siteSettingsSnapshot.exists()) {
          const settingsData = siteSettingsSnapshot.val()
          setSiteSettings(settingsData)
          maintenanceEnabled = settingsData.maintenanceEnabled || false
        }

        setUnderMaintenance(maintenanceEnabled)
        
        if (maintenanceEnabled) {
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


        if (!underMaintenance) {
          const committeesRef = ref(db, 'committees')
          const snapshot = await get(committeesRef)
          
          if (snapshot.exists()) {
            const committeesData = snapshot.val()
            const committeesArray = Object.keys(committeesData).map(key => ({
              id: key,
              ...committeesData[key],
              portfolios: Object.keys(committeesData[key].portfolios || {}).map(portfolioKey => ({
                id: portfolioKey,
                ...committeesData[key].portfolios[portfolioKey]
              }))
            }))
            setCommittees(committeesArray)
          }
        }
        setLoading(false)
      } catch (err) {
        console.error("Failed to load data:", err)
        setLoading(false)
      }
    }

    fetchData()
  }, [underMaintenance])

  if (!isMounted) return null

  if (underMaintenance) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md mx-auto border border-slate-200 p-8 rounded-2xl bg-white shadow-xl"
        >
          <div className="mb-6">
            <Image 
              src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" 
              alt="KIMUN Logo" 
              width={100} 
              height={100} 
              className="mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Under Maintenance</h1>
          <p className="text-slate-600 mb-6">We are currently performing scheduled system updates. Please check back shortly.</p>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Refreshing In</h2>
            <div className="text-4xl font-mono font-bold text-indigo-600">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </div>
          </div>
          
          <Button onClick={() => window.location.reload()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg">
            Refresh Page
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900 antialiased selection:bg-indigo-100">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-3">
            <Image src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Kalinga International MUN Logo" width={34} height={34} />
            <span className="text-md font-bold text-slate-900 tracking-tight hidden sm:inline-block">
              Kalinga International Model United Nations
            </span>
          </Link>
          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            {["Home", "About", "Registration", "Matrix", "Resources", "Committees", "Delegate"].map((item) => (
              <Link key={item} href={item === "Home" ? "/" : `/${item.toLowerCase()}`} className="text-slate-600 hover:text-indigo-600 transition-colors relative py-1 group">
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </nav>
          <MobileNav />
        </div>
      </header>

      {/* Professional Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-white border-b border-slate-200 overflow-hidden pt-16">
        <div className="container mx-auto px-6 max-w-7xl grid lg:grid-cols-12 gap-12 items-center relative z-20">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3 w-3" /> Annual Conference {siteSettings?.eventDate || '2026'}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              The Premier Platform For <span className="text-indigo-600">Global Diplomacy</span> & Debate
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-xl leading-relaxed">
              Join hundreds of delegates at Kalinga International MUN {siteSettings?.eventDate || '2026'}. Engage in professional discussions, solve global challenges, and build institutional leadership skills.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link href="/registration">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-6 rounded-lg shadow-lg shadow-indigo-600/10 transition-all inline-flex items-center gap-2">
                  Open Registration Portal <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold px-8 py-6 rounded-lg shadow-sm">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="lg:col-span-5 relative hidden lg:block">
            <motion.div style={{ opacity }} className="relative aspect-square w-full max-w-[420px] mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-sky-100 rounded-3xl rotate-3 scale-105 opacity-60"></div>
              <div className="absolute inset-0 bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden p-3 z-10">
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100">
                  <Image
                    src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/chatgpt-image-mar-29-2025-12_03_59-pm.png"
                    alt="Conference Assembly"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-[0.03] z-0"></div>
      </section>

      {/* Marquee Section */}
      <section className="py-6 bg-slate-50 border-b border-slate-200 overflow-hidden text-xs tracking-wider font-bold text-slate-400">
        <ParallaxText baseVelocity={-2}>DIPLOMACY • LEADERSHIP • GLOBAL ISSUES • DEBATE • NETWORKING</ParallaxText>
      </section>

      {/* Status Banner */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="container mx-auto px-6 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Kalinga International MUN &apos;26</div>
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-lg text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-slate-700 font-semibold">
              {loading ? "Checking Status..." : (
                committees.some(c => c.portfolios.some(p => p.isVacant)) 
                  ? "Registration Status: Open" 
                  : "Registration Status: Closed"
              )}
            </span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section ref={ref1} className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={inView1 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">About the Event</span>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Conference Overview</h2>
              </div>
              
              <div className="text-slate-600 space-y-4 text-base leading-relaxed">
                <p>
                  Kalinga International MUN is a recognized conference dedicated to international diplomacy, consensus-building, and academic debate. We offer an environment where students can assume the roles of global policymakers to address pressing international problems.
                </p>
                <p>
                  Our {siteSettings?.eventDate || '2026'} session brings together diverse student delegates from multiple regions for a rigorous, educational, two-day experience focused on standard United Nations procedures.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <Calendar className="text-indigo-600 h-5 w-5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Duration</h4>
                    <p className="text-sm font-semibold text-slate-800">{siteSettings?.eventDuration || '2-Day Conference'}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <Users className="text-indigo-600 h-5 w-5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Attendance</h4>
                    <p className="text-sm font-semibold text-slate-800">{siteSettings?.attendanceTarget || '300+ Delegates'}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <Globe className="text-indigo-600 h-5 w-5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Structure</h4>
                    <p className="text-sm font-semibold text-slate-800">7 Active Committees</p>
                  </div>
                </div>
                <a href="https://maps.app.goo.gl/2rP1Kp8fFzY8rABy6" target="_blank" rel="noopener noreferrer" className="block group">
                  <div className="p-4 bg-slate-50 border border-slate-200 group-hover:border-indigo-200 rounded-xl flex items-center gap-3 h-full transition-colors">
                    <MapPin className="text-indigo-600 h-5 w-5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase">Venue</h4>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{siteSettings?.eventVenue || 'ASBMU, India'}</p>
                    </div>
                  </div>
                </a>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={inView1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative aspect-video lg:aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
                <Image
                  src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/chatgpt-image-mar-29-2025-08_39_55-pm.png"
                  alt="Delegate Hall Session"
                  width={600}
                  height={600}
                  className="object-cover w-full h-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Corporate Partners Section */}
      <section ref={ref3} className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center space-y-2 mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Collaborations</span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Our Conference Partners</h2>
          </div>

          <div className="space-y-16 max-w-4xl mx-auto">
            {sponsors.map((sponsor) => (
              <div key={sponsor.name} className="space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                  {sponsor.name}
                </h3>
                <div className="flex flex-wrap justify-center items-center gap-8">
                  {sponsor.logos.map((logo) => (
                    <a 
                      key={logo.alt}
                      href={logo.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <Image
                        src={logo.url}
                        alt={logo.alt}
                        width={sponsor.tier === 'gold' ? 220 : 180}
                        height={90}
                        className="object-contain max-h-16 mx-auto"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <a href="mailto:info@kimun.in.net" className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-md">
              Become an Official Sponsor
            </a>
          </div>
        </div>
      </section>

      {/* Committees Matrix Preview */}
      <section ref={ref2} className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center space-y-2 mb-12">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Available Options</span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Conference Committees</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-medium text-slate-400">Loading live database records...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {committees.slice(0, 6).map((committee) => {
                  const vacantPortfolios = committee.portfolios.filter(p => p.isVacant).length
                  const totalPortfolios = committee.portfolios.length
                  const fillPercentage = totalPortfolios > 0 ? Math.round(((totalPortfolios - vacantPortfolios) / totalPortfolios) * 100) : 0

                  return (
                    <div key={committee.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="text-base font-bold text-slate-900 leading-snug">{committee.name}</h3>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 shrink-0">
                            {fillPercentage}% Full
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {vacantPortfolios} of {totalPortfolios} total structural slots remaining.
                        </p>
                      </div>
                      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <Link href="/matrix" className="text-indigo-600 hover:text-indigo-700 text-xs font-bold inline-flex items-center gap-0.5 group">
                          View Allocation Matrix 
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/committees" className="w-full sm:w-auto">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-5 text-sm rounded-lg">
                    View All Committees
                  </Button>
                </Link>
                <Link href="/matrix" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold px-6 py-5 text-sm rounded-lg">
                    Check Registration Matrix
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-16 text-xs text-slate-500 font-medium">
        <div className="container mx-auto px-6 max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Image src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Kalinga International MUN Logo" width={24} height={24} />
              Kalinga International MUN
            </h3>
            <p className="leading-relaxed">The region's benchmark educational assembly for strategic debate and model diplomacy operations.</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Navigation</h3>
            <ul className="space-y-2.5">
              <li><Link href="/" className="text-slate-600 hover:text-indigo-600 transition-colors">Home Page</Link></li>
              <li><Link href="/about" className="text-slate-600 hover:text-indigo-600 transition-colors">About Conference</Link></li>
              <li><Link href="/registration" className="text-slate-600 hover:text-indigo-600 transition-colors">Register Online</Link></li>
              <li><Link href="/committees" className="text-slate-600 hover:text-indigo-600 transition-colors">All Committees</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Resources</h3>
            <ul className="space-y-2.5">
              <li><Link href="/resources" className="text-slate-600 hover:text-indigo-600 transition-colors">Study Guides</Link></li>
              <li><Link href="/resources" className="text-slate-600 hover:text-indigo-600 transition-colors">Rules of Procedure</Link></li>
              <li><Link href="/resources" className="text-slate-600 hover:text-indigo-600 transition-colors">Position Papers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Contact Details</h3>
            <ul className="space-y-2">
              <li className="text-slate-600">Email: info@kimun.in.net</li>
              <li className="text-slate-600">Support: +918249979557</li>
              <li className="flex space-x-3.5 pt-4">
                <a href="https://www.facebook.com/kimun24" className="text-slate-400 hover:text-indigo-600 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                </a>
                <a href="https://www.instagram.com/kalingainternationalmun" className="text-slate-400 hover:text-indigo-600 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416 1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 110-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                </a>
                <a href="https://x.com/kimun2026" className="text-slate-400 hover:text-indigo-600 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-slate-100 text-center text-slate-400 font-semibold">
          <p>© {siteSettings?.eventDate || '2026'} Kalinga International MUN Secretariat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
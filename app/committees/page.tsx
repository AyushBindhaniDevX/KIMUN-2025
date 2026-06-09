'use client'

import { motion } from "framer-motion"
import { ChevronRight, Loader2, ArrowLeft, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import MobileNav from "@/components/mobile-nav"
import { useInView } from "react-intersection-observer"
import { useEffect, useState } from "react"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, get } from "firebase/database"

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
  type: string
  description: string
  topics: string[]
  eb: EBMember[]
  portfolios: Portfolio[]
  backgroundGuide?: string
  rules?: string
}

type EBMember = {
  id: string
  name: string
  role: string
  bio?: string
  photourl?: string
  instagram?: string
}

type Portfolio = {
  id: string
  country: string
  countryCode: string
  isDoubleDelAllowed: boolean
  isVacant: boolean
  minExperience: number
}

export default function CommitteesPage() {
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [ref1, inView1] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [ref3, inView3] = useInView({ triggerOnce: true, threshold: 0.1 })

  useEffect(() => {
    const fetchCommittees = async () => {
      try {
        const app = initializeApp(firebaseConfig)
        const db = getDatabase(app)
        const committeesRef = ref(db, 'committees')
        const snapshot = await get(committeesRef)
        
        if (snapshot.exists()) {
          const committeesData = snapshot.val()
          const committeesArray = Object.keys(committeesData).map(key => {
            const rawCommittee = committeesData[key] ?? {}
            const rawTopics = rawCommittee.topics
            const rawEb = rawCommittee.eb
            const rawPortfolios = rawCommittee.portfolios

            const topics = Array.isArray(rawTopics)
              ? rawTopics.filter((topic): topic is string => typeof topic === 'string')
              : rawTopics && typeof rawTopics === 'object'
                ? Object.values(rawTopics).filter((topic): topic is string => typeof topic === 'string')
                : []

            const eb = Array.isArray(rawEb)
              ? rawEb
              : rawEb && typeof rawEb === 'object'
                ? Object.entries(rawEb).map(([memberId, member]) => ({
                    id: memberId,
                    ...(member as Record<string, unknown>)
                  }))
                : []

            const portfolios = Array.isArray(rawPortfolios)
              ? rawPortfolios.map((portfolio, index) => ({
                  id: String(index),
                  ...(portfolio as Record<string, unknown>)
                }))
              : rawPortfolios && typeof rawPortfolios === 'object'
                ? Object.entries(rawPortfolios).map(([portfolioKey, portfolio]) => ({
                    id: portfolioKey,
                    ...(portfolio as Record<string, unknown>)
                  }))
                : []

            return {
              id: key,
              ...rawCommittee,
              topics,
              eb,
              portfolios
            }
          })
          setCommittees(committeesArray)
        }
        setLoading(false)
      } catch (err) {
        setError('Failed to load committees data')
        setLoading(false)
      }
    }

    fetchCommittees()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <div className="text-center p-8">
          <div className="animate-spin flex justify-center mb-4">
            <Loader2 className="h-8 w-8 text-indigo-600" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading committees system...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl max-w-md border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold mb-2">Error Loading Councils</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900 antialiased selection:bg-indigo-100">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-7xl">
          <Link href="/" className="inline-flex items-center gap-2 group text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="text-xs tracking-widest uppercase text-slate-400 font-bold">
            KIMUN 2026 • Directories
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative h-[45vh] flex items-center bg-white border-b border-slate-200 overflow-hidden pt-16">
        <div className="container mx-auto px-6 max-w-7xl relative z-20 text-left space-y-4">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Active Forums</div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Conference Committees</h1>
          <p className="text-slate-600 max-w-2xl text-base md:text-lg leading-relaxed">
            Explore the specialized councils, scheduled agendas, and executive leadership panels configured for KIMUN 2026.
          </p>
        </div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-[0.03] z-0"></div>
      </section>

      {/* Core Grid Showcase */}
      <section ref={ref1} className="py-16 container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div initial={{ opacity: 0 }} animate={inView1 ? { opacity: 1 } : {}} transition={{ duration: 0.4 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {committees.map((committee) => {
              const portfolios = committee.portfolios ?? []
              const topics = committee.topics ?? []
              const ebMembers = committee.eb ?? []

              return (
                <motion.div key={committee.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="relative flex">
                  <Card className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between w-full hover:border-slate-300 transition-colors">
                    <div>
                      <div className="relative h-40 bg-slate-100 border-b border-slate-100">
                        <Image
                          src={`https://placehold.co/600x400/f8fafc/cbd5e1?text=${encodeURIComponent(committee.name)}`}
                          alt={committee.name}
                          fill
                          className="object-cover opacity-90 mix-blend-multiply"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-transparent p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-indigo-600 bg-white border border-slate-100 px-2 py-0.5 rounded-md shadow-sm">
                              {portfolios.filter(p => p.isVacant).length} of {portfolios.length} positions open
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md bg-slate-100 border border-slate-200 text-slate-600">
                              {committee.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold text-slate-900 leading-snug">{committee.name}</CardTitle>
                        <CardDescription className="text-xs text-slate-500 leading-relaxed pt-1">{committee.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-5">
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Council Agenda</h4>
                          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                            {topics.map((topic, i) => (
                              <li key={i} className="leading-normal">{topic}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-50">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Executive Board</h4>
                          <div className="space-y-2">
                            {ebMembers.map((member, index) => (
                              <div key={member.id || `${member.name}-${index}`} className="flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-200/60 rounded-lg text-xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0">
                                    {member.photourl ? (
                                      <Image src={member.photourl} alt={member.name} fill className="object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-slate-800 truncate">{member.name}</h5>
                                    {member.instagram && (
                                      <a href={`https://instagram.com/${member.instagram}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-indigo-600 transition-colors block truncate">
                                        @{member.instagram}
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 border border-indigo-100/50 px-2 py-0.5 rounded-md shrink-0">
                                  {member.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                    
                    {(committee.backgroundGuide || committee.rules) && (
                      <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 gap-2 flex-wrap">
                        {committee.backgroundGuide && (
                          <a href={committee.backgroundGuide} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-2 rounded-lg shadow-sm transition-colors">
                            Background Guide
                          </a>
                        )}
                        {committee.rules && (
                          <a href={committee.rules} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-2 rounded-lg shadow-sm transition-colors">
                            Rules of Procedure
                          </a>
                        )}
                      </CardFooter>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </section>

      {/* Registration Callout Section */}
      <section ref={ref3} className="py-20 bg-white border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-4xl text-center space-y-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={inView3 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Ready to Select Your Assignment?</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed mt-2">
              Onboarding registration is fully open. Seat distributions follow a timeline tracking first-come entries relative to our live ledger matrix.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link href="/registration">
                <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-5 text-xs rounded-lg inline-flex items-center gap-1 shadow-sm">
                  Register For Council <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/resources">
                <Button variant="outline" className="w-full sm:w-auto border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold px-6 py-5 text-xs rounded-lg shadow-sm">
                  Access Study Materials
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-16 text-xs text-slate-500 font-medium">
        <div className="container mx-auto px-4 max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Image src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Kalinga International MUN Logo" width={24} height={24} />
              Kalinga International MUN
            </h3>
            <p className="leading-relaxed">The region's definitive educational assembly for strategic debate and model diplomacy operations.</p>
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
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416 1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 110-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" fillRule="evenodd" /></svg>
                </a>
                <a href="https://x.com/kimun2026" className="text-slate-400 hover:text-indigo-600 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-slate-100 text-center text-slate-400 font-semibold">
          <p>© 2026 Kalinga International MUN Secretariat. All institutional privileges retained.</p>
        </div>
      </footer>
    </div>
  )
}
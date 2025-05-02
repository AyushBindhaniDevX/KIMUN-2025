'use client'

import { motion, useScroll, useTransform } from "framer-motion"
import { ChevronRight, Loader2, ChevronLeft, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 100])
  const y2 = useTransform(scrollY, [0, 500], [0, -100])
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [ref1, inView1] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [ref2, inView2] = useInView({ triggerOnce: true, threshold: 0.1 })
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
          const committeesArray = Object.keys(committeesData).map(key => ({
            id: key,
            ...committeesData[key],
            eb: committeesData[key].eb ? Object.values(committeesData[key].eb) : [],
            portfolios: Object.keys(committeesData[key].portfolios || {}).map(portfolioKey => ({
              id: portfolioKey,
              ...committeesData[key].portfolios[portfolioKey]
            }))
          }))
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
          <p className="text-amber-300">Loading committees...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-900/50 p-6 rounded-xl border border-red-700/30">
          <h2 className="text-xl font-semibold text-amber-300 mb-2">Error</h2>
          <p className="text-gray-300 max-w-md mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-amber-600 hover:bg-amber-700 text-black"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const CommitteeCard = ({ committee }: { committee: Committee }) => (
    <motion.div
      key={committee.id}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      <Card className="bg-black/50 backdrop-blur-sm border border-amber-800/30 hover:border-amber-500 transition-colors overflow-hidden">
        <div className="relative h-48">
          <Image
            src={`https://placehold.co/600x400/111111/FFBF00?text=${encodeURIComponent(committee.name)}`}
            alt={committee.name}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-amber-300">
                {committee.portfolios.filter(p => p.isVacant).length} of {committee.portfolios.length} available
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-amber-900/50 text-amber-300 capitalize">
                {committee.type}
              </span>
            </div>
          </div>
        </div>
        
        <CardHeader>
          <CardTitle className="text-amber-300">{committee.name}</CardTitle>
          <CardDescription className="text-gray-400">{committee.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-2">Agenda Items</h4>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              {committee.topics.map((topic, i) => (
                <li key={i}>{topic}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">Executive Board</h4>
            <div className="grid grid-cols-1 gap-4">
              {committee.eb.map((member) => (
                <div key={member.id} className="flex items-start space-x-4 p-3 bg-black/30 rounded-lg">
                  <div className="flex-shrink-0 relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-700">
                    {member.photourl ? (
                      <Image
                        src={member.photourl}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-amber-900/50 flex items-center justify-center">
                        <User className="w-6 h-6 text-amber-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <h5 className="font-medium text-amber-300">{member.name}</h5>
                      <span className="text-xs text-amber-500 bg-amber-900/50 px-2 py-1 rounded-full capitalize">
                        {member.role}
                      </span>
                    </div>
                    {member.bio && (
                      <p className="text-sm text-gray-400 mt-1">{member.bio}</p>
                    )}
                    {member.instagram && (
                      <a
                        href={`https://instagram.com/${member.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-500 hover:text-amber-400 text-xs mt-2 inline-block"
                      >
                        @{member.instagram}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(committee.backgroundGuide || committee.rules) && (
            <div>
              <h4 className="font-semibold text-white mb-2">Resources</h4>
              <div className="flex flex-wrap gap-2">
                {committee.backgroundGuide && (
                  <a
                    href={committee.backgroundGuide}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-amber-900/50 text-amber-300 rounded-full hover:bg-amber-800 transition-colors"
                  >
                    Background Guide
                  </a>
                )}
                {committee.rules && (
                  <a
                    href={committee.rules}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-amber-900/50 text-amber-300 rounded-full hover:bg-amber-800 transition-colors"
                  >
                    Rules of Procedure
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-amber-800/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Image 
                  src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" 
                  alt="KIMUN Logo" 
                  width={40} 
                  height={40} 
                  className="mr-2" 
                />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-lg font-bold text-amber-300 hidden sm:inline-block"
              >
                Kalinga International MUN
              </motion.span>
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            {["Home", "About", "Registration", "Matrix", "Resources", "Committees"].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
              >
                <Link
                  href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                  className="text-amber-100 hover:text-amber-400 transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 transition-all group-hover:w-full"></span>
                </Link>
              </motion.div>
            ))}
          </nav>
          <MobileNav />
        </div>
      </header>

      <section ref={ref1} className="py-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={inView1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-amber-300 mb-4">All Committees</h2>
              <p className="text-xl text-amber-100 max-w-2xl mx-auto">
                Discover the various committees and their agendas for KIMUN 2025
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {committees.map((committee) => (
                <CommitteeCard key={committee.id} committee={committee} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section ref={ref3} className="py-20 bg-gradient-to-r from-amber-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={inView3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">Ready to join a committee?</h2>
            <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
              Register now to secure your preferred committee assignment. Early registrants get priority in country allocations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/registration">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-black px-8 py-6 text-lg rounded-full group">
                    Register Now
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/resources">
                  <Button
                    variant="outline"
                    className="border-amber-600 text-amber-300 hover:bg-amber-800 hover:text-white px-8 py-6 text-lg rounded-full group"
                  >
                    Download Resources
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="bg-black border-t border-amber-800/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
                <Image 
                  src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" 
                  alt="KIMUN Logo" 
                  width={30} 
                  height={30} 
                />
                KIMUN 2025
              </h3>
              <p className="text-gray-400">Premier Model UN conference in Eastern India</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {["Home", "About", "Registration", "Committees"].map((link) => (
                  <li key={link}>
                    <Link 
                      href={`/${link.toLowerCase()}`} 
                      className="text-gray-400 hover:text-amber-400 transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-4">Resources</h3>
              <ul className="space-y-2">
                {["Background Guides", "Rules", "Position Papers"].map((resource) => (
                  <li key={resource}>
                    <Link 
                      href="/resources" 
                      className="text-gray-400 hover:text-amber-400 transition-colors"
                    >
                      {resource}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">Email: info@kimun.in</li>
                <li className="text-gray-400">Phone: +91 82499 79557</li>
                <li className="flex space-x-4 mt-4">
                  {[
                    { name: "Facebook", href: "#", icon: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" },
                    { name: "Instagram", href: "#", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" }
                  ].map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      className="text-gray-400 hover:text-amber-400 transition-colors"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d={social.icon} clipRule="evenodd" />
                      </svg>
                    </a>
                  ))}
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-amber-800/20 text-center text-gray-400">
            <p>© 2025 Kalinga International MUN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
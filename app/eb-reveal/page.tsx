'use client'

import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ChevronRight, User, ArrowRight, Instagram, Gift } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, get } from "firebase/database"
import confetti from "canvas-confetti"
import { Card } from "@/components/ui/card"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

type EBMember = {
  id: string
  name: string
  role: string
  committee: string
  bio?: string
  photourl?: string
  instagram?: string
  email?: string
}

export default function EBRevealPage() {
  const [ebMembers, setEBMembers] = useState<EBMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [tapCounts, setTapCounts] = useState<Record<string, number>>({})
  const [tapPositions, setTapPositions] = useState<Array<{ x: number; y: number }>>([])
  const [justRevealed, setJustRevealed] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchEBMembers = async () => {
      try {
        const app = initializeApp(firebaseConfig)
        const db = getDatabase(app)
        const committeesRef = ref(db, 'committees')
        const snapshot = await get(committeesRef)
        
        if (snapshot.exists()) {
          const committeesData = snapshot.val()
          const ebArray: EBMember[] = []
          
          Object.keys(committeesData).forEach(committeeId => {
            const committee = committeesData[committeeId]
            if (committee.eb) {
              Object.keys(committee.eb).forEach(memberId => {
                const member = committee.eb[memberId]
                ebArray.push({
                  id: memberId,
                  name: member.name,
                  role: member.role,
                  committee: committee.name,
                  bio: member.bio,
                  photourl: member.photourl,
                  instagram: member.instagram
                })
              })
            }
          })
          
          setEBMembers(ebArray)
        }
        setLoading(false)
      } catch (err) {
        console.error(err)
        setError('Failed to load EB members data')
        setLoading(false)
      }
    }

    fetchEBMembers()
  }, [])

  const currentMember = ebMembers[currentIndex]
  const isRevealed = (id: string) => (tapCounts[id] || 0) >= 3

  const handleTap = (id: string, e: React.MouseEvent) => {
    if (isRevealed(id) || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2

    setTapPositions((prev) => [
      ...prev,
      {
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
      },
    ])

    setTimeout(() => {
      setTapPositions((prev) => prev.slice(1))
    }, 2000)

    const newCount = (tapCounts[id] || 0) + 1
    setTapCounts((prev) => ({
      ...prev,
      [id]: newCount,
    }))

    if (newCount === 3) {
      setJustRevealed(true)

      const rect = cardRef.current.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2

      confetti({
        particleCount: 100,
        spread: 70,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ["#FFD700", "#FFC107", "#FFECB3", "#E6C200"],
      })

      setTimeout(() => {
        setJustRevealed(false)
      }, 2000)
    }
  }

  const nextCard = () => {
    if (currentIndex < ebMembers.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 text-amber-500 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-amber-300">Loading executive board...</p>
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

  if (ebMembers.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-amber-300 mb-4">No Executive Board Members Found</h2>
          <p className="text-gray-400 mb-6">Check back later for updates</p>
          <Link href="/">
            <Button className="bg-amber-600 hover:bg-amber-700 text-black">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

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
        </div>
      </header>

      <section className="pt-32 pb-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-amber-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 tracking-tight">
                KIMUN 2025
              </h1>
              <Sparkles className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-2xl font-semibold text-amber-300 mb-4">Executive Board Reveal</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Tap on the card to reveal our distinguished Executive Board members
            </p>
          </div>

          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, rotateY: -90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: 90 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="flex justify-center perspective-1000 w-full max-w-sm"
              >
                <Card
                  ref={cardRef}
                  className={`w-full h-[550px] relative overflow-hidden cursor-pointer transition-all duration-500 border-0 ${
                    isRevealed(currentMember.id)
                      ? "bg-gradient-to-br from-zinc-900 to-black text-white"
                      : "bg-gradient-to-br from-zinc-900 to-black text-white"
                  }`}
                  onClick={(e) => handleTap(currentMember.id, e)}
                  style={{
                    boxShadow: isRevealed(currentMember.id)
                      ? "0 0 20px rgba(255, 215, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.1)"
                      : "0 0 15px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {/* Glowing border */}
                  <div
                    className={`absolute inset-0 rounded-lg ${
                      isRevealed(currentMember.id) ? "border-4 border-amber-500/80" : "border border-amber-500/30"
                    }`}
                  ></div>

                  {/* Tap animations */}
                  {tapPositions.map((pos, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 1 }}
                      className="absolute pointer-events-none"
                      style={{
                        left: `calc(50% + ${pos.x}px)`,
                        top: `calc(50% + ${pos.y}px)`,
                        zIndex: 20,
                      }}
                    >
                      <Gift className="text-amber-500 w-8 h-8" />
                    </motion.div>
                  ))}

                  {!isRevealed(currentMember.id) ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                      {/* Mystery card design */}
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-amber-700/10">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-40 h-40 rounded-full border-8 border-amber-500/30 flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full border-4 border-amber-500/20 flex items-center justify-center">
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center border border-amber-500/30">
                                <span className="text-4xl font-bold text-amber-500">
                                  {tapCounts[currentMember.id] || 0}/3
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <motion.div
                        animate={{
                          y: [0, -5, 0],
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: "reverse",
                        }}
                        className="absolute bottom-20 text-center"
                      >
                        <p className="text-center text-xl font-medium mb-3 text-amber-500/90">Tap to reveal</p>
                        <p className="text-center text-sm text-gray-400">
                          {3 - (tapCounts[currentMember.id] || 0)} more{" "}
                          {(tapCounts[currentMember.id] || 0) === 2 ? "tap" : "taps"} needed
                        </p>
                      </motion.div>

                      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                        <p className="text-gray-500 text-sm">
                          {currentIndex + 1}/{ebMembers.length}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: { duration: 0.8 },
                      }}
                      className="absolute inset-0 flex flex-col items-center p-6"
                    >
                      {/* Glowing header */}
                      <div className="absolute top-14 left-0 right-0 flex justify-center">
                        <div className="px-4 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-bold rounded-full shadow-lg">
                          KIMUN 2025
                        </div>
                      </div>

                      {/* Profile image with modern frame */}
                      <div className="w-32 h-32 rounded-full border-4 border-amber-500/80 mt-16 mb-4 relative overflow-hidden shadow-lg">
                        {currentMember.photourl ? (
                          <motion.img
                            initial={{ scale: justRevealed ? 1.2 : 1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.8 }}
                            src={currentMember.photourl}
                            alt={currentMember.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-amber-900/50 flex items-center justify-center">
                            <User className="w-16 h-16 text-amber-500" />
                          </div>
                        )}
                      </div>

                      {/* Name with decorative elements */}
                      <div className="relative mb-2">
                        <h3 className="text-2xl font-bold text-amber-400 text-center">{currentMember.name}</h3>
                        <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
                      </div>
                      <br />

                      {/* Info cards */}
                      <div className="w-full space-y-3 mb-4">
                        <div className="bg-gradient-to-r from-amber-900/30 to-amber-700/20 rounded-lg p-3 border border-amber-500/30">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Position</span>
                            <span className="text-white font-medium">{currentMember.role}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-amber-900/30 to-amber-700/20 rounded-lg p-3 border border-amber-500/30">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Committee</span>
                            <span className="text-white font-medium">{currentMember.committee}</span>
                          </div>
                        </div>
                      </div>

                      {/* Instagram link */}
                      {currentMember.instagram && (
                        <a 
                          href={`https://instagram.com/${currentMember.instagram}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full mb-4"
                        >
                          <Button variant="outline" className="w-full border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                            <Instagram className="h-4 w-4 mr-2" />
                            Follow on Instagram
                          </Button>
                        </a>
                      )}

                      {/* Bio */}
                      {currentMember.bio && (
                        <div className="w-full mb-4 bg-gradient-to-r from-amber-900/30 to-amber-700/20 rounded-lg p-3 border border-amber-500/30">
                          <p className="text-gray-300 text-sm">{currentMember.bio}</p>
                        </div>
                      )}

                      {/* Register button */}
                      <div className="mt-auto w-full">
                        <Link href="/registration">
                          <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold shadow-lg">
                            Register Now
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6 max-w-sm mx-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={prevCard}
              disabled={currentIndex === 0}
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>

            <div className="flex items-center space-x-2">
              {ebMembers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex ? "bg-amber-500 w-6" : "bg-amber-500/30"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextCard}
              disabled={currentIndex === ebMembers.length - 1}
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
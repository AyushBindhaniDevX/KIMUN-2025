"use client"

import { motion,useScroll, useTransform } from "framer-motion"
import { ChevronRight, Loader2,ChevronLeft  } from "lucide-react"
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
  type: string
  description: string
  topics: string[]
  eb: string[]
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

export default function CommitteesPage() {
  const { scrollY } = useScroll()
    const y1 = useTransform(scrollY, [0, 500], [0, 100])
    const y2 = useTransform(scrollY, [0, 500], [0, -100])
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [ref1, inView1] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const [ref2, inView2] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const [ref3, inView3] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

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

  // Group committees by type
  const committeeTypes = {
    general: committees.filter(c => c.type === 'general'),
    specialized: committees.filter(c => c.type === 'specialized'),
    crisis: committees.filter(c => c.type === 'crisis'),
    regional: committees.filter(c => c.type === 'regional')
  }
  

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation and Hero Section remain the same as your original code */}


{/* Header would be in a layout component */}
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-amber-800/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Image src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Kalinga International MUN Logo" width={40} height={40} className="mr-2" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-lg font-bold text-amber-300 hidden sm:inline-block"
              >
                Kalinga International Model United Nations
              </motion.span>
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            {["Home", "About", "Registration", "Matrix", "Resources", "Committees"].map(
              (item, i) => (
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
              ),
            )}
          </nav>
          <MobileNav />
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0 z-0" style={{ y: y1 }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-300 z-10"></div>
          <Image
            src="https://media.discordapp.net/attachments/1268556254448455713/1355478794244329564/ChatGPT_Image_Mar_29_2025_12_03_59_PM.png?ex=67e91380&is=67e7c200&hm=59e346e38d159dbf58b27969af08fa1f6e7ced5bc7e59483bc5202b4aceaecf5&=&format=webp&quality=lossless&width=1001&height=668"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-20 z-10"></div>

        <div className="container mx-auto px-4 z-20 mt-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-6xl font-bold text-amber-300 mb-4">Committee</h1>
            <p className="text-xl text-amber-100 max-w-3xl">
              Learn more about Kalinga International MUN's Commitees and more informations.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Committees Section */}
      <section ref={ref1} className="py-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={inView1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8 }}
          >
            <Tabs defaultValue="general" className="w-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView1 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
               <TabsList className="grid w-full grid-cols-3 gap-0.5 mb-12 bg-black border border-amber-800/30 rounded-lg p-0.5">
  {[
    { value: "general", label: "General" },
    { value: "specialized", label: "Specialized" },
    { value: "regional", label: "Regional" },
  ].map((tab) => (
    <TabsTrigger
      key={tab.value}
      value={tab.value}
      className="text-amber-100 data-[state=active]:bg-amber-900/50 data-[state=active]:text-amber-300 hover:text-amber-400 transition-all py-2 px-4 rounded-md"
    >
      {tab.label}
    </TabsTrigger>
  ))}
</TabsList>
              </motion.div>

              {/* General Assemblies */}
              <TabsContent value="general">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView1 ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {committeeTypes.general.map((committee) => {
                    const vacantPortfolios = committee.portfolios.filter(p => p.isVacant).length
                    const allocatedPortfolios = committee.portfolios.length - vacantPortfolios

                    return (
                      <motion.div
                        key={committee.id}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.2 }}
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
          {Object.values(committee.portfolios || {}).filter((p) => p.isVacant).length} of {Object.keys(committee.portfolios || {}).length} available
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1 w-4 rounded-full ${
                i < Math.min(5, Math.ceil((Object.values(committee.portfolios || {}).filter((p) => !p.isVacant).length / Object.keys(committee.portfolios || {}).length) * 5))
                  ? 'bg-amber-500'
                  : 'bg-amber-900/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
  <CardHeader>
    <CardTitle className="text-amber-300">{committee.name}</CardTitle>
    <CardDescription className="text-gray-400">{committee.description}</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Agenda Items */}
    <div className="mb-4">
      <h4 className="font-semibold text-white mb-2">Agenda Items:</h4>
      <ul className="list-disc list-inside text-gray-300 space-y-1">
        {(committee.topics && Array.isArray(committee.topics) && committee.topics.length > 0) ? (
          committee.topics.map((topic, i) => <li key={i}>{topic.trim()}</li>)
        ) : (
          <li>No topics available</li>
        )}
      </ul>
    </div>

    {/* Executive Board */}
    <div>
      <h4 className="font-semibold text-white mb-2">Executive Board:</h4>
      <p className="text-gray-300">
  {committee.eb
    ? Object.values(committee.eb)
        .map((member: any) => member.name)
        .join(", ")
    : "N/A"}
</p>    </div>
  </CardContent>
</Card>

                      </motion.div>
                    )
                  })}
                </motion.div>
              </TabsContent>

              {/* Specialized Agencies */}
              <TabsContent value="specialized">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView1 ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {committeeTypes.specialized.map((committee) => {
                    const vacantPortfolios = committee.portfolios.filter(p => p.isVacant).length
                    const allocatedPortfolios = committee.portfolios.length - vacantPortfolios

                    return (
                      <motion.div
                        key={committee.id}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.2 }}
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
                                  {vacantPortfolios} of {committee.portfolios.length} available
                                </span>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <div 
                                      key={i} 
                                      className={`h-1 w-4 rounded-full ${
                                        i < Math.min(5, Math.ceil((allocatedPortfolios / committee.portfolios.length) * 5))
                                          ? 'bg-amber-500'
                                          : 'bg-amber-900/50'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <CardHeader>
                            <CardTitle className="text-amber-300">{committee.name}</CardTitle>
                            <CardDescription className="text-gray-400">{committee.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="mb-4">
                              <h4 className="font-semibold text-white mb-2">Agenda Items:</h4>
                              <ul className="list-disc list-inside text-gray-300 space-y-1">
                                {committee.topics.map((topic, i) => (
                                  <li key={i}>{topic}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-white mb-2">Executive Board:</h4>
                              <p className="text-gray-300">
  {committee.eb && typeof committee.eb === "object"
    ? Object.values(committee.eb)
        .map((member: any) => member.name)
        .join(", ")
    : "N/A"}
</p>                            </div>
                          </CardContent>
                          
                        </Card>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </TabsContent>

              {/* Crisis Committees */}
              <TabsContent value="crisis">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView1 ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {committeeTypes.crisis.map((committee) => {
                    const vacantPortfolios = committee.portfolios.filter(p => p.isVacant).length
                    const allocatedPortfolios = committee.portfolios.length - vacantPortfolios

                    return (
                      <motion.div
                        key={committee.id}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.2 }}
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
                                  {vacantPortfolios} of {committee.portfolios.length} available
                                </span>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <div 
                                      key={i} 
                                      className={`h-1 w-4 rounded-full ${
                                        i < Math.min(5, Math.ceil((allocatedPortfolios / committee.portfolios.length) * 5))
                                          ? 'bg-amber-500'
                                          : 'bg-amber-900/50'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <CardHeader>
                            <CardTitle className="text-amber-300">{committee.name}</CardTitle>
                            <CardDescription className="text-gray-400">{committee.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="mb-4">
                              <h4 className="font-semibold text-white mb-2">Agenda Items:</h4>
                              <ul className="list-disc list-inside text-gray-300 space-y-1">
                                {committee.topics.map((topic, i) => (
                                  <li key={i}>{topic}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-white mb-2">Executive Board:</h4>
                              <p className="text-gray-300">
  {committee.eb && typeof committee.eb === "object"
    ? Object.values(committee.eb)
        .map((member: any) => member.name)
        .join(", ")
    : "N/A"}
</p>                            </div>
                          </CardContent>
                         
                        </Card>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </TabsContent>

              {/* Regional Bodies */}
              <TabsContent value="regional">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView1 ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {committeeTypes.regional.map((committee) => {
                    const vacantPortfolios = committee.portfolios.filter(p => p.isVacant).length
                    const allocatedPortfolios = committee.portfolios.length - vacantPortfolios

                    return (
                      <motion.div
                        key={committee.id}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.2 }}
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
                                  {vacantPortfolios} of {committee.portfolios.length} available
                                </span>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <div 
                                      key={i} 
                                      className={`h-1 w-4 rounded-full ${
                                        i < Math.min(5, Math.ceil((allocatedPortfolios / committee.portfolios.length) * 5))
                                          ? 'bg-amber-500'
                                          : 'bg-amber-900/50'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <CardHeader>
                            <CardTitle className="text-amber-300">{committee.name}</CardTitle>
                            <CardDescription className="text-gray-400">{committee.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="mb-4">
                              <h4 className="font-semibold text-white mb-2">Agenda Items:</h4>
                              <ul className="list-disc list-inside text-gray-300 space-y-1">
                                {committee.topics.map((topic, i) => (
                                  <li key={i}>{topic}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-white mb-2">Executive Board:</h4>
                              <p className="text-gray-300">
  {committee.eb && typeof committee.eb === "object"
    ? Object.values(committee.eb)
        .map((member: any) => member.name)
        .join(", ")
    : "N/A"}
</p>                            </div>
                          </CardContent>
                          
                        </Card>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>
      {/* Committee Structure */}
      <section ref={ref2} className="py-20 bg-gradient-to-b from-black to-amber-950/10 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={inView2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8 }}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-amber-300">Committee Structure</h2>
            <p className="text-xl text-amber-100 mt-4 max-w-2xl mx-auto">
              Understanding the roles and responsibilities within each committee
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <Card className="bg-black/50 backdrop-blur-sm border border-amber-800/30 hover:border-amber-500 transition-colors">
              <CardHeader>
                <CardTitle className="text-amber-300">Executive Board Members</CardTitle>
                <CardDescription className="text-gray-400">Per committee leadership structure</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-6">
                  {[
                    {
                      title: "Chairperson",
                      description: "Presides over committee sessions, ensures adherence to rules of procedure, and facilitates debate.",
                    },
                    {
                      title: "Vice-Chairperson",
                      description: "Assists the Chairperson and may take over in their absence. Helps manage the flow of debate.",
                    },
                    {
                      title: "Rapporteur",
                      description: "Keeps track of all working papers, draft resolutions, and amendments. Prepares reports on committee proceedings.",
                    },
                  ].map((role, index) => (
                    <li key={index} className="flex items-start">
                      <div className="bg-amber-700 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-4 mt-1">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">{role.title}</h4>
                        <p className="text-gray-300">{role.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-black/50 backdrop-blur-sm border border-amber-800/30 hover:border-amber-500 transition-colors">
              <CardHeader>
                <CardTitle className="text-amber-300">Delegate Positions</CardTitle>
                <CardDescription className="text-gray-400">Roles available to participants</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-6">
                  {[
                    {
                      title: "Member States",
                      description: "Representatives of UN member countries with full voting rights on substantive and procedural matters.",
                    },
                    {
                      title: "Observer States",
                      description: "Entities with observer status that can participate in discussions but cannot vote on substantive matters.",
                    },
                    
                  ].map((role, index) => (
                    <li key={index} className="flex items-start">
                      <div className="bg-amber-700 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-4 mt-1">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">{role.title}</h4>
                        <p className="text-gray-300">{role.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
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
              Register now to secure your preferred committee assignment. Early registrants get priority in country
              allocations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/registration">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-black px-8 py-6 text-lg rounded-full group">
                    Register Now
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/resources">
                  <Button
                    variant="outline"
                    className="border-amber-600 text-amber-300 hover:bg-amber-800 hover:text-white px-8 py-6 text-lg rounded-full group"
                  >
                    Download Background Guide
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

{/* Footer */}
      <footer className="bg-black border-t border-amber-800/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
                <Image src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Kalinga International MUN Logo" width={30} height={30} className="mr-2" />
                Kalinga International MUN
              </h3>
              <p className="text-gray-400">The premier Model United Nations conference in the region.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-amber-400 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/registration" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/committees" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Committees
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/resources" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Study Guides
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Rules of Procedure
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Position Papers
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-gray-400 hover:text-amber-400 transition-colors">
                    FAQs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">Email: info@kimun.in.net</li>
                <li className="text-gray-400">Phone: +918249979557</li>
                <li className="flex space-x-4 mt-4">
                  <a href="https://www.facebook.com/kimun24" className="text-gray-400 hover:text-amber-400 transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a href="https://www.instagram.com/kalingainternationalmun" className="text-gray-400 hover:text-amber-400 transition-colors">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a href="https://x.com/kimun2025" className="text-gray-400 hover:text-amber-400 transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
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

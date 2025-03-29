"use client"

import { motion } from "framer-motion"
import { Download, FileText, Video, ChevronRight, Link as LinkIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

type Resource = {
  id: string
  title: string
  description: string
  type: 'guide' | 'rules' | 'template' | 'training'
  url: string
  committee?: string
  pages?: number
  includes?: string[]
  format?: string
}

export default function ResourcesPage() {
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

  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const resourcesRef = ref(db, 'resources')
        const snapshot = await get(resourcesRef)
        
        if (snapshot.exists()) {
          const resourcesData = snapshot.val()
          const resourcesList = Object.keys(resourcesData).map(key => ({
            id: key,
            ...resourcesData[key]
          }))
          setResources(resourcesList)
        } else {
          setResources([])
        }
        setLoading(false)
      } catch (err) {
        console.error('Error fetching resources:', err)
        setError('Failed to load resources')
        setLoading(false)
      }
    }

    fetchResources()
  }, [])

  const getResourcesByType = (type: string) => {
    return resources.filter(resource => resource.type === type)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-amber-400">Loading resources...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center p-6 bg-black/50 rounded-lg max-w-md border border-amber-800/30">
          <h2 className="text-xl font-bold text-amber-500 mb-2">Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-amber-600 hover:bg-amber-700 text-black"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-amber-800/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="https://media.discordapp.net/attachments/1268556254448455713/1355478819359817789/KIMUN_Logo_Color.png?ex=67e91386&is=67e7c206&hm=069060e64b9b750db76fd94f7b58e95940e6bb791a6c78f672b8361f802b7084&=&format=webp&quality=lossless&width=900&height=900" 
                alt="Kalinga International MUN Logo" 
                width={40} 
                height={40} 
                className="mr-2" 
              />
              <span className="text-lg font-bold text-amber-300 hidden sm:inline-block">
                Kalinga International Model United Nations
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            {["Home", "About", "Registration", "Matrix", "Resources", "Committees"].map(
              (item) => (
                <Link
                  key={item}
                  href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                  className={`${item === "Resources" ? "text-amber-400" : "text-amber-100"} hover:text-amber-400 transition-colors relative group`}
                >
                  {item}
                  <span className={`absolute -bottom-1 left-0 w-${item === "Resources" ? "full" : "0"} h-0.5 bg-amber-400 transition-all group-hover:w-full`}></span>
                </Link>
              ),
            )}
          </nav>
          <MobileNav />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-95 z-50"></div>
          <Image
            src="https://media.discordapp.net/attachments/1268556254448455713/1355566816155537601/ChatGPT_Image_Mar_29_2025_08_39_55_PM.png?ex=67e9657a&is=67e813fa&hm=babe623629d9beb92acd74716a14bc9b261b072ff506f354ef7622175ddc2c5c&=&format=webp&quality=lossless&width=438&height=438"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="container mx-auto px-4 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-amber-300 mb-4">Resources</h1>
            <p className="text-xl md:text-2xl text-amber-100 max-w-3xl mx-auto">
              Everything you need to prepare for Kalinga International MUN 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Resources Tabs */}
      <section ref={ref1} className="py-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={inView1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8 }}
          >
            <Tabs defaultValue="guides" className="w-full">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 mb-12 bg-black border border-amber-800/30">
                {[
                  { value: "guides", label: "Study Guides" },
                  { value: "rules", label: "Rules of Procedure" },
                  { value: "templates", label: "Templates" },
                  { value: "training", label: "Training" },
                ].map((tab, index) => (
                  <motion.div
                    key={tab.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <TabsTrigger
                      value={tab.value}
                      className="text-amber-100 data-[state=active]:bg-amber-900/50 data-[state=active]:text-amber-300 hover:text-amber-400 transition-all"
                    >
                      {tab.label}
                    </TabsTrigger>
                  </motion.div>
                ))}
              </TabsList>

              {/* Study Guides */}
              <TabsContent value="guides">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView1 ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {getResourcesByType('guide').map((resource, index) => (
                    <motion.div
                      key={resource.id}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="bg-black/50 backdrop-blur-sm border border-amber-800/30 hover:border-amber-500 transition-colors">
                        <CardHeader>
                          <CardTitle className="text-amber-300">{resource.title}</CardTitle>
                          <CardDescription className="text-gray-400">
                            {resource.committee && `Committee: ${resource.committee}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-gray-300">
                          <div className="flex items-center mb-4">
                            <FileText className="text-amber-500 mr-2 h-5 w-5" />
                            <span>{resource.pages || 'N/A'} pages</span>
                          </div>
                          <p>{resource.description}</p>
                        </CardContent>
                        <CardFooter>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-black group">
                              <Download className="mr-2 h-4 w-4" /> 
                              Download Guide
                              <ChevronRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                          </a>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              {/* Rules of Procedure */}
              <TabsContent value="rules">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView1 ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  {getResourcesByType('rules').map((resource, index) => (
                    <Card key={resource.id} className="bg-black/50 backdrop-blur-sm border border-amber-800/30 hover:border-amber-500 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-amber-300">{resource.title}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {resource.committee || 'Standard rules for all committees'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {resource.description && (
                          <div className="mb-6">
                            <p className="text-gray-300">{resource.description}</p>
                          </div>
                        )}
                        <div className="mt-6">
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-black group">
                              <Download className="mr-2 h-4 w-4" /> 
                              Download {resource.committee ? 'Committee Rules' : 'Full Rules'}
                              <ChevronRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              </TabsContent>

              {/* Templates */}
              <TabsContent value="templates">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView1 ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {getResourcesByType('template').map((resource) => (
                    <motion.div
                      key={resource.id}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="bg-black/50 backdrop-blur-sm border border-amber-800/30 hover:border-amber-500 transition-colors">
                        <CardHeader>
                          <CardTitle className="text-amber-300">{resource.title}</CardTitle>
                          <CardDescription className="text-gray-400">{resource.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-gray-300">
                          {resource.includes && (
                            <>
                              <p className="text-sm text-amber-100 font-semibold mb-2">Includes:</p>
                              <ul className="list-disc list-inside space-y-1 mb-4">
                                {resource.includes.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </>
                          )}
                          {resource.format && (
                            <p className="text-sm">
                              <span className="text-amber-100 font-semibold">Format:</span> {resource.format}
                            </p>
                          )}
                        </CardContent>
                        <CardFooter>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-black group">
                              <Download className="mr-2 h-4 w-4" /> 
                              Download Template
                              <ChevronRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                          </a>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              {/* Training Materials */}
              <TabsContent value="training">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView1 ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="space-y-8"
                >
                  {getResourcesByType('training').map((resource) => (
                    <Card key={resource.id} className="bg-black/50 backdrop-blur-sm border border-amber-800/30 hover:border-amber-500 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-amber-300">{resource.title}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {resource.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-start">
                            {resource.format?.includes('video') ? (
                              <Video className="text-amber-500 mr-3 h-5 w-5 mt-1" />
                            ) : (
                              <FileText className="text-amber-500 mr-3 h-5 w-5 mt-1" />
                            )}
                            <div>
                              <h4 className="text-white font-medium">{resource.title}</h4>
                              <p className="text-gray-300 text-sm">
                                {resource.description}
                              </p>
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-amber-400 text-sm hover:underline flex items-center"
                              >
                                {resource.format?.includes('video') ? 'Watch Video' : 'Download PDF'} 
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>

      {/* FAQs */}
      <section ref={ref2} className="py-20 bg-gradient-to-b from-black to-amber-950/10 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={inView2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8 }}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-amber-300">Frequently Asked Questions</h2>
            <p className="text-xl text-amber-100 mt-4 max-w-2xl mx-auto">
              Common questions about preparing for Kalinga International MUN
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  question: "What is a position paper and why is it important?",
                  answer: "A position paper outlines your country's stance on the committee topics. It includes background information, your country's policies, and proposed solutions. Position papers demonstrate your preparation to the committee chairs."
                },
                {
                  question: "How should I prepare for the conference?",
                  answer: "Research your assigned country's history and foreign policy, study the committee topics, review study guides, familiarize yourself with rules of procedure, practice public speaking, and write a well-researched position paper."
                },
                {
                  question: "What is the dress code for the conference?",
                  answer: "Delegates must wear Western business attire: suits for men and formal business attire for women. National attire is also acceptable. Casual clothing is not permitted during committee sessions."
                },
                {
                  question: "How are awards determined?",
                  answer: "Awards are based on quality of debate, adherence to country policy, participation, collaboration, quality of position papers, and problem-solving skills. Awards include Best Delegate, Outstanding Delegate, and Honorable Mention."
                },
                {
                  question: "Can I request a specific country or committee?",
                  answer: "Yes, you can indicate preferences during registration. Allocations are made on a first-come, first-served basis, with priority given to early registrants. We also consider delegation size and experience level."
                }
              ].map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`} 
                  className="border-amber-800/30 mb-4 last:mb-0"
                >
                  <AccordionTrigger className="text-white hover:text-amber-300 text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Contact for Resources */}
      <section ref={ref3} className="py-20 bg-gradient-to-r from-amber-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={inView3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">Need Additional Resources?</h2>
            <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
              If you need specific resources or have questions about preparing for the conference, our team is here to help.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-amber-600 hover:bg-amber-700 text-black px-8 py-6 text-lg rounded-full group">
                Contact Academic Team
                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-amber-800/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
                <Image 
                  src="https://media.discordapp.net/attachments/1268556254448455713/1355478819359817789/KIMUN_Logo_Color.png?ex=67e91386&is=67e7c206&hm=069060e64b9b750db76fd94f7b58e95940e6bb791a6c78f672b8361f802b7084&=&format=webp&quality=lossless&width=900&height=900" 
                  alt="Kalinga International MUN Logo" 
                  width={30} 
                  height={30} 
                />
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
                  <Link href="/resources" className="text-amber-400 hover:text-amber-300 transition-colors">
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
                <li className="text-gray-400">Email: info@kimun.in.co</li>
                <li className="text-gray-400">Phone: +918249979557</li>
                <li className="flex space-x-4 mt-4">
                  <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
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
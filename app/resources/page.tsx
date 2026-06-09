"use client"

import { motion } from "framer-motion"
import { Download, FileText, Video, ChevronRight, ArrowLeft } from "lucide-react"
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
  const [ref1, inView1] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [ref2, inView2] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [ref3, inView3] = useInView({ triggerOnce: true, threshold: 0.1 })

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <div className="text-center p-8">
          <div className="animate-spin flex justify-center mb-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading resources system...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="text-center p-8 bg-white rounded-2xl max-w-md border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold mb-2">Error Loading Materials</h2>
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
            KIMUN 2026 • Library
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative h-[45vh] flex items-center bg-white border-b border-slate-200 overflow-hidden pt-16">
        <div className="container mx-auto px-6 max-w-7xl relative z-20 text-left space-y-4">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Preparation Center</div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Delegate Resources</h1>
          <p className="text-slate-600 max-w-2xl text-base md:text-lg leading-relaxed">
            Access study guides, structural rules, and document templates to prepare for Kalinga International MUN 2026.
          </p>
        </div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-[0.03] z-0"></div>
      </section>

      {/* Resources Hub */}
      <section ref={ref1} className="py-16 max-w-7xl mx-auto px-6">
        <Tabs defaultValue="guides" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-10 bg-white border border-slate-200 p-1 rounded-xl shadow-sm h-auto gap-1">
            {[
              { value: "guides", label: "Study Guides" },
              { value: "rules", label: "Rules of Procedure" },
              { value: "templates", label: "Document Templates" },
              { value: "training", label: "Training Guides" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs font-semibold py-2.5 rounded-lg text-slate-600 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 transition-all"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Study Guides tab */}
          <TabsContent value="guides">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getResourcesByType('guide').map((resource) => (
                <Card key={resource.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold text-slate-900 leading-snug">{resource.title}</CardTitle>
                    {resource.committee && (
                      <CardDescription className="text-xs text-indigo-600 font-semibold pt-1">
                        {resource.committee}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 flex-grow">
                    <div className="flex items-center text-xs font-medium text-slate-400">
                      <FileText className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                      <span>{resource.pages || 'N/A'} pages • PDF Format</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{resource.description}</p>
                  </CardContent>
                  <CardFooter className="bg-slate-50/50 border-t border-slate-100 pt-4">
                    <Button asChild size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4">
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Download Guide
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rules of Procedure Tab */}
          <TabsContent value="rules">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getResourcesByType('rules').map((resource) => (
                <Card key={resource.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-6 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{resource.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      {resource.committee || 'Standard institutional procedures for all committees.'}
                    </p>
                    {resource.description && (
                      <p className="text-xs text-slate-500 leading-relaxed mt-3">{resource.description}</p>
                    )}
                  </div>
                  <Button asChild size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 mt-2">
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Download Guidelines
                    </a>
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getResourcesByType('template').map((resource) => (
                <Card key={resource.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold text-slate-900 leading-snug">{resource.title}</CardTitle>
                    <CardDescription className="text-xs text-slate-400">{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow">
                    {resource.includes && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Document Scope:</span>
                        <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                          {resource.includes.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                    {resource.format && (
                      <div className="text-xs text-slate-500 font-medium">
                        <span className="text-slate-400">File Type:</span> {resource.format}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-slate-50/50 border-t border-slate-100 pt-4">
                    <Button asChild size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4">
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Download Template
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training">
            <div className="grid grid-cols-1 gap-4 max-w-3xl">
              {getResourcesByType('training').map((resource) => (
                <Card key={resource.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 shrink-0 mt-0.5">
                      {resource.format?.includes('video') ? (
                        <Video className="text-indigo-600 h-5 w-5" />
                      ) : (
                        <FileText className="text-indigo-600 h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{resource.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1 max-w-xl">{resource.description}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="border-slate-200 shrink-0 text-slate-700 font-semibold text-xs bg-white hover:bg-slate-50 h-9">
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                      {resource.format?.includes('video') ? 'Watch Briefing' : 'Open Document'}
                      <ChevronRight className="h-3 w-3" />
                    </a>
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Accordion FAQ Section */}
      <section ref={ref2} className="py-20 bg-white border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center space-y-2 mb-12">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Help Center</span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {[
              {
                question: "What is a position paper and why is it required?",
                answer: "A position paper summarizes your assigned country's explicit stance on the specified committee topics. It provides essential historical background, policy justifications, and operational proposals. Submitting this artifact cleanly is mandatory to qualify for delegate awards."
              },
              {
                question: "How should I properly prepare for committee debate?",
                answer: "We recommend reviewing our released study guides thoroughly, analyzing your assigned nation's factual foreign policy ledger, reading up on the structural Rules of Procedure documents, and mapping out potential resolution alliances."
              },
              {
                question: "What is the official dress code protocol?",
                answer: "Delegates must strictly adhere to Western business formal attire (suits, blazers, formal trousers/skirts) during all official council schedules. National historical attire is also fully permitted. Casual elements are not allowed in sessions."
              },
              {
                question: "How are individual delegate awards evaluated?",
                answer: "Awards (including Best Delegate and Outstanding Delegate metrics) are audited by committee directors. Criteria focus on policy consistency, qualitative debate value, resolution leadership, and collaborative diplomacy parameters."
              },
              {
                question: "Can I request specific allocation pairings?",
                answer: "Yes, you can register committee parameters during initial onboarding. Allocations operate on a strict first-come, first-served sequence based on remaining live ledger matrix vacancies."
              }
            ].map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-slate-200 bg-slate-50/40 rounded-xl px-5 py-1">
                <AccordionTrigger className="text-sm font-bold text-slate-800 hover:text-indigo-600 hover:no-underline transition-colors py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-500 leading-relaxed pb-4 border-t border-slate-200/40 pt-3">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Support CTA Callout */}
      <section ref={ref3} className="py-20 bg-white text-center px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Need Additional Materials?</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
            If your assigned committee requires specialized documentation or you require additional clarification regarding reporting rules, please contact our support team.
          </p>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-5 rounded-lg text-xs inline-flex items-center gap-1.5 shadow-md">
            Contact Academic Team <ChevronRight className="h-3.5 w-3.5" />
          </Button>
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
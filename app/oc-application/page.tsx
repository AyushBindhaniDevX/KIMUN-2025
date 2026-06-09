// app/oc-application/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Users,
  Settings,
  Layout,
  BadgeCheck,
  Handshake,
  Network,
  Rocket,
  FileBadge,
  ChevronRight,
  ArrowLeft,
  LogIn,
  LogOut,
  ArrowRight,
  Check,
  Loader2,
  Building,
  Phone,
  UserCheck,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GraduationCap,
  Clock, Sparkles,
  Calendar
} from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { firebaseAuth, firebaseDb, googleProvider, firebaseStorage } from '@/lib/firebase-client'
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth'
import { ref, get, set, update, onValue } from 'firebase/database'
import { ref as sRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
// @ts-ignore
import confetti from 'canvas-confetti'

const DEPARTMENTS = [
  "Business Relations & Corporate Strategy",
  "Operations & Infrastructure Logistics",
  "Delegate Affairs & Global Relations",
  "Design, Media & Digital Identity"
]

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

export default function OCApplicationPage() {
  // Authentication & DB states
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [checkingApp, setCheckingApp] = useState(false)
  const [application, setApplication] = useState<any | null>(null)

  // Form states
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    course: '',
    year: '1st',
    pref1: '',
    pref2: '',
    experience: '',
    statement: '',
    resume: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Onboarding states
  const [docFiles, setDocFiles] = useState({ collegeId: '', aadhar: '', photo: '' })
  const [docsProgress, setDocsProgress] = useState({ collegeId: 0, aadhar: 0, photo: 0 })
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [docsError, setDocsError] = useState('')

  // NDA contract states
  const [ndaAgreed, setNdaAgreed] = useState(false)
  const [signatureText, setSignatureText] = useState('')
  const [signingError, setSigningError] = useState('')
  const [signing, setSigning] = useState(false)

  const triggerConfetti = () => {
    if (typeof window !== 'undefined') {
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.6 }
      })
    }
  }

  // Effect to trigger confetti on welcomed state mount
  useEffect(() => {
    if (application && application.status === 'welcomed') {
      triggerConfetti()
    }
  }, [application?.status])

  const simulateFallbackUpload = async (field: 'collegeId' | 'aadhar' | 'photo', file: File) => {
    try {
      const base64Data = await convertToBase64(file)
      setDocFiles(prev => ({ ...prev, [field]: base64Data }))
    } catch (e) {
      console.warn("Base64 fallback failed, using blob URL:", e)
      try {
        const objectUrl = URL.createObjectURL(file)
        setDocFiles(prev => ({ ...prev, [field]: objectUrl }))
      } catch (err) {
        setDocFiles(prev => ({ ...prev, [field]: file.name }))
      }
    }
    
    setDocsProgress(prev => ({ ...prev, [field]: 10 }))
    let current = 10
    const interval = setInterval(() => {
      current += 20
      if (current >= 100) {
        current = 100
        clearInterval(interval)
      }
      setDocsProgress(prev => ({ ...prev, [field]: current }))
    }, 80)
  }

  const handleRealUpload = (field: 'collegeId' | 'aadhar' | 'photo', file: File) => {
    if (!user) return
    setDocsError('')
    
    if (file.size > 2.5 * 1024 * 1024) {
      setDocsError(`File "${file.name}" is too large. Max allowed size is 2.5MB.`)
      return
    }
    
    // Set initial state to show progress immediately
    setDocFiles(prev => ({ ...prev, [field]: file.name }))
    setDocsProgress(prev => ({ ...prev, [field]: 0 }))
    
    try {
      const storagePath = `oc_onboarding/${user.uid}/${field}_${Date.now()}_${file.name}`
      const storageRefInstance = sRef(firebaseStorage, storagePath)
      const uploadTask = uploadBytesResumable(storageRefInstance, file)

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          setDocsProgress(prev => ({ ...prev, [field]: progress }))
        },
        (error) => {
          console.warn("Storage upload failed, using fallback:", error)
          simulateFallbackUpload(field, file)
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
            setDocFiles(prev => ({ ...prev, [field]: downloadUrl }))
            setDocsProgress(prev => ({ ...prev, [field]: 100 }))
          } catch (err) {
            console.warn("Get download URL failed, using fallback:", err)
            simulateFallbackUpload(field, file)
          }
        }
      )
    } catch (e) {
      console.warn("Firebase Storage initialization failed, using fallback:", e)
      simulateFallbackUpload(field, file)
    }
  }

  const handleDocumentsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!docFiles.collegeId || !docFiles.aadhar || !docFiles.photo) {
      setDocsError('Please upload all required onboarding documents before submitting.')
      return
    }
    setUploadingDocs(true)
    setDocsError('')

    try {
      const appRef = ref(firebaseDb, `oc_applications/${user.uid}`)
      const updates = {
        status: 'contract',
        documentsSubmittedAt: new Date().toISOString(),
        documents: docFiles
      }
      await update(appRef, updates)

      // Notify email dispatch api
      await fetch('/api/send-onboarding-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          type: 'contract',
          candidateName: user.displayName
        })
      })

      setApplication(prev => ({ ...prev, ...updates }))
    } catch (err: any) {
      console.error("Error submitting documents:", err)
      setDocsError(err.message || 'Failed to submit documents. Please try again.')
    } finally {
      setUploadingDocs(false)
    }
  }

  const handleNDASign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!ndaAgreed) {
      setSigningError('You must agree to the NDA terms by ticking the checkbox.')
      return
    }
    if (!signatureText.trim()) {
      setSigningError('Please enter your full name as digital signature.')
      return
    }
    setSigning(true)
    setSigningError('')

    try {
      const appRef = ref(firebaseDb, `oc_applications/${user.uid}`)
      const updates = {
        status: 'welcomed',
        contractSignedAt: new Date().toISOString(),
        signature: signatureText
      }
      await update(appRef, updates)

      // Notify email dispatch api
      await fetch('/api/send-onboarding-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          type: 'welcomed',
          candidateName: user.displayName
        })
      })

      setApplication(prev => ({ ...prev, ...updates }))
      triggerConfetti()
    } catch (err: any) {
      console.error("Error signing NDA:", err)
      setSigningError(err.message || 'Failed to submit signature. Please try again.')
    } finally {
      setSigning(false)
    }
  }

  // Motion animation presets
  const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  }

  // Handle auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)

      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          name: currentUser.displayName || '',
          email: currentUser.email || ''
        }))
      } else {
        setApplication(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // Listen to application in real-time
  useEffect(() => {
    if (!user) {
      setApplication(null)
      setCheckingApp(false)
      return
    }

    setCheckingApp(true)
    const appRef = ref(firebaseDb, `oc_applications/${user.uid}`)
    const unsubscribe = onValue(appRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setApplication(data)
        if (data.documents) {
          setDocFiles({
            collegeId: data.documents.collegeId || '',
            aadhar: data.documents.aadhar || '',
            photo: data.documents.photo || ''
          })
          setDocsProgress({
            collegeId: data.documents.collegeId ? 100 : 0,
            aadhar: data.documents.aadhar ? 100 : 0,
            photo: data.documents.photo ? 100 : 0
          })
        }
      } else {
        setApplication(null)
      }
      setCheckingApp(false)
    }, (err) => {
      console.error("Error subscribing to application updates:", err)
      setCheckingApp(false)
    })

    return () => unsubscribe()
  }, [user])

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    try {
      await signInWithPopup(firebaseAuth, googleProvider)
    } catch (err) {
      console.error("Google Sign-In Error:", err)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    setAuthLoading(true)
    try {
      await signOut(firebaseAuth)
      setStep(1)
      setFormData({
        name: '',
        email: '',
        phone: '',
        college: '',
        course: '',
        year: '1st',
        pref1: '',
        pref2: '',
        experience: '',
        statement: '',
        resume: ''
      })
      setFormErrors({})
      setSubmitSuccess(false)
    } catch (err) {
      console.error("Sign-Out Error:", err)
    } finally {
      setAuthLoading(false)
    }
  }

  // Form field handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear validation error for that field when user types
    if (formErrors[name]) {
      setFormErrors(prev => {
        const copy = { ...prev }
        delete copy[name]
        return copy
      })
    }
  }

  // Validate fields for the current step
  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!formData.name.trim()) errors.name = "Full name is required"
      if (!formData.phone.trim()) {
        errors.phone = "Phone number is required"
      } else if (!/^\+?[0-9\s-]{10,15}$/.test(formData.phone.trim())) {
        errors.phone = "Enter a valid 10-15 digit phone number"
      }
      if (!formData.college.trim()) errors.college = "College/Institution is required"
      if (!formData.course.trim()) errors.course = "Course/Degree is required"
      if (!formData.year) errors.year = "Year of study is required"
    }

    if (currentStep === 2) {
      if (!formData.pref1) errors.pref1 = "First preference is required"
      if (!formData.pref2) errors.pref2 = "Second preference is required"
      if (formData.pref1 && formData.pref2 && formData.pref1 === formData.pref2) {
        errors.pref2 = "First and second preferences cannot be the same"
      }
    }

    if (currentStep === 3) {
      if (!formData.statement.trim()) {
        errors.statement = "Statement of purpose is required"
      } else if (formData.statement.trim().length < 50) {
        errors.statement = "SOP must be at least 50 characters long"
      }
      if (!formData.resume.trim()) {
        errors.resume = "Resume link is required"
      } else if (!/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(formData.resume.trim())) {
        errors.resume = "Enter a valid URL (starting with http:// or https://)"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    setStep(prev => prev - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!validateStep(3)) return

    setSubmitting(true)
    setSubmitError('')

    const payload = {
      uid: user.uid,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      college: formData.college,
      course: formData.course,
      year: formData.year,
      pref1: formData.pref1,
      pref2: formData.pref2,
      experience: formData.experience,
      statement: formData.statement,
      resume: formData.resume,
      status: 'pending',
      submittedAt: new Date().toISOString()
    }

    try {
      const appRef = ref(firebaseDb, `oc_applications/${user.uid}`)
      await set(appRef, payload)

      // Notify email dispatch api
      await fetch('/api/send-onboarding-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          type: 'applied',
          candidateName: user.displayName
        })
      }).catch(err => console.error("Email dispatch error:", err))

      setSubmitSuccess(true)
      setApplication(payload)
    } catch (err: any) {
      console.error("Submission Error:", err)
      setSubmitError(err.message || "Failed to submit application. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-foreground">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-7xl">
          <Link href="/" className="inline-flex items-center gap-2 group text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>
          <div className="text-xs tracking-widest uppercase text-slate-400 font-bold">
            KIMUN 2026 • Secretariat
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-32 pb-24 max-w-7xl">
        {/* Hero Banner Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-16"
        >
          <motion.div variants={fadeIn} className="relative h-80 w-full mb-8 rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
            <Image
              src="https://i.ibb.co/39mnH5Kc/AIPPM21.jpg"
              alt="KIMUN Organizing Committee"
              fill
              className="object-cover object-center brightness-[0.4]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-indigo-950/10"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col justify-end">
              <span className="text-indigo-400 text-xs font-bold tracking-widest uppercase mb-2">Executive Appointments</span>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white max-w-4xl">
                Join the KIMUN 2026 Organising Committee
              </h1>
              <p className="mt-3 text-base md:text-lg text-slate-200 max-w-2xl leading-relaxed">
                Contribute to the organisation and delivery of a professional Model United Nations conference.
              </p>
            </div>
          </motion.div>

          {/* Quick Pillars */}
          <motion.div
            variants={fadeIn}
            className="flex flex-wrap gap-2.5 justify-start"
          >
            {[
              { icon: Rocket, label: "Executive Leadership" },
              { icon: Network, label: "Global Enterprise Network" },
              { icon: FileBadge, label: "UN-Authenticated Certification" },
              { icon: Handshake, label: "Corporate Relations" }
            ].map((tag, idx) => (
              <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm">
                <tag.icon className="h-3.5 w-3.5 text-indigo-600" /> {tag.label}
              </span>
            ))}
          </motion.div>
        </motion.section>

        {/* Benefits Framework */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-20"
        >
          <div className="flex flex-col items-start mb-10">
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-600 mb-1">Professional Growth</span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Strategic Career Advantages
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BadgeCheck,
                title: "Executive Endorsement",
                desc: "Receive a formal Letter of Recommendation authenticating your operational metrics, heavily prioritized by institutional corporate firms and graduate program filters.",
                badge: "Institutional Capital"
              },
              {
                icon: FileBadge,
                title: "UN-Authenticated Credentials",
                desc: "Differentiate your professional profile via certified credentials vetted through established global framework representatives.",
                badge: "International Standard"
              },
              {
                icon: Network,
                title: "Enterprise Tier Networking",
                desc: "Develop long-term corporate pipelines alongside senior industry consultants, corporate sponsors, and career diplomats.",
                badge: "Strategic Connections"
              }
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                variants={fadeIn}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                <div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg w-10 h-10 flex items-center justify-center mb-5">
                    <benefit.icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">{benefit.desc}</p>
                </div>
                <div className="text-[11px] tracking-wider font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/60 px-2.5 py-1 rounded-md w-fit">
                  {benefit.badge}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Department Showcase */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-20"
        >
          <div className="flex flex-col items-start mb-10">
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-600 mb-1">Corporate Structure</span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Areas of Specialization
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Handshake,
                title: "Business Relations & Corporate Strategy",
                subtitle: "Capital Management & Brand Partnerships",
                image: "https://placehold.co/800x400/f8fafc/cbd5e1?text=Business+Relations",
                points: [
                  "Acquire and oversee blue-chip corporate partnerships and allocations",
                  "Direct critical multi-channel public relations strategies",
                  "Develop institutional partner communication plans and investment proposals",
                  "Formulate detailed fiscal projections and post-event ROI audits"
                ]
              },
              {
                icon: Settings,
                title: "Operations & Infrastructure Logistics",
                subtitle: "Strategic Real Estate & Security Management",
                image: "https://placehold.co/800x400/f8fafc/cbd5e1?text=Logistics+Team",
                points: [
                  "Command complex operational and venue timelines end-to-end",
                  "Draft detailed architectural layouts and resource mappings for hosting facilities",
                  "Coordinate cross-border protocol arrangements for visiting dignitaries",
                  "Enforce secure risk-assessment parameters and rapid-response logic"
                ]
              },
              {
                icon: Users,
                title: "Delegate Affairs & Global Relations",
                subtitle: "Stakeholder Management & Communications",
                image: "https://placehold.co/800x400/f8fafc/cbd5e1?text=Delegate+Affairs",
                points: [
                  "Act as the primary administrative point-of-contact for institutional partners",
                  "Compose structural rule books, background files, and academic guides",
                  "Manage client services, conference lodging options, and support pipelines",
                  "Optimize regional acquisition strategies and verify applicant metrics"
                ]
              },
              {
                icon: Layout,
                title: "Design, Media & Digital Identity",
                subtitle: "Brand Systems & Communication Design",
                image: "https://placehold.co/800x400/f8fafc/cbd5e1?text=Design+Team",
                points: [
                  "Standardize design libraries, visual guidelines, and digital brand identities",
                  "Produce professional audio-visual campaign summaries and opening media reels",
                  "Design high-quality print matrices and interface frameworks for public releases",
                  "Collaborate with digital strategy units to boost online engagement metrics"
                ]
              }
            ].map((dept, idx) => (
              <motion.div
                key={idx}
                variants={fadeIn}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 w-full border-b border-slate-200 bg-slate-100">
                    <Image
                      src={dept.image}
                      alt={dept.title}
                      fill
                      className="object-cover mix-blend-multiply opacity-90"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start gap-3.5 mb-4">
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg shrink-0 mt-0.5">
                        <dept.icon className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">{dept.title}</h3>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">{dept.subtitle}</p>
                      </div>
                    </div>
                    <ul className="space-y-2.5 mt-5 border-t border-slate-100 pt-4">
                      {dept.points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-normal">
                          <span className="text-indigo-600 font-black shrink-0 mt-0.5">▪</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Application Portal Section */}
        <span id="apply-portal" className="block scroll-mt-24"></span>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto border-t border-slate-200 pt-16"
        >
          {authLoading || checkingApp ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-600">Verifying session credentials...</p>
            </div>
          ) : !user ? (
            /* Google Sign-in Prompt */
            <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-sm text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-full mb-4">
                <Rocket className="h-3.5 w-3.5" /> Direct Recruitment Channel
              </span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-3">Apply to KIMUN 2026 Organizing Committee</h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
                Join our operational unit. Track your status in real-time. Please authenticate using your Google account to access the official candidate application form.
              </p>

              <Button
                onClick={handleGoogleSignIn}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-md shadow-indigo-600/10 transition-all duration-150 inline-flex items-center gap-3 cursor-pointer"
              >
                <LogIn className="h-5 w-5" /> Sign in with Google to Apply
              </Button>

              <p className="text-xs text-slate-400 mt-6 leading-relaxed">
                We only require basic Google profile verification to identify unique applicants and prevent duplicates.
              </p>
            </div>
          ) : application ? (
            /* Candidate Dashboard Status Card */
            <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 mb-8">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Candidate Portal</p>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">Hello, {user.displayName}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-600 font-semibold px-4 py-2 text-xs rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer self-start md:self-auto"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </Button>
              </div>

              {/* Visual Pipeline Timeline */}
              <div className="mb-10 px-4">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 relative">
                  {/* Progress Line */}
                  <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-100 -z-10">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                      style={{
                        width:
                          application.status === 'pending' ? '0%' :
                            application.status === 'interview' ? '25%' :
                              (application.status === 'onboarding' || application.status === 'approved') ? '50%' :
                                application.status === 'contract' ? '75%' :
                                  application.status === 'welcomed' ? '100%' : '0%'
                      }}
                    ></div>
                  </div>

                  {[
                    { key: 'pending', label: '1. Applied' },
                    { key: 'interview', label: '2. Interview' },
                    { key: 'onboarding', label: '3. Onboarding' },
                    { key: 'contract', label: '4. NDA Contract' },
                    { key: 'welcomed', label: '5. Welcomed' }
                  ].map((s, idx) => {
                    const statuses = ['pending', 'interview', 'onboarding', 'contract', 'welcomed']
                    const currentStatus = application.status === 'approved' ? 'onboarding' : application.status
                    const currentIdx = statuses.indexOf(currentStatus)
                    const itemIdx = statuses.indexOf(s.key)
                    const isCompleted = itemIdx < currentIdx
                    const isActive = itemIdx === currentIdx

                    return (
                      <div key={s.key} className="flex flex-col items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${isCompleted
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : isActive
                              ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}>
                          {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                        </div>
                        <span className={isActive ? 'text-indigo-600 font-extrabold' : isCompleted ? 'text-slate-600 font-semibold' : 'text-slate-400'}>
                          {s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-6 md:p-8 rounded-2xl border bg-slate-50/50 flex flex-col items-start gap-6 relative overflow-hidden">
                {/* 1. PENDING STATUS */}
                {application.status === 'pending' && (
                  <div className="flex flex-col md:flex-row items-start gap-6 w-full">
                    <div className="bg-amber-100 border border-amber-200 p-4 rounded-xl text-amber-600 shrink-0">
                      <Clock className="h-8 w-8 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Stage 1: Application Under Review
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-3">Your application is currently being evaluated</h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        We have successfully logged your submission under choice 1 (<strong className="text-slate-800">{application.pref1}</strong>) and choice 2 (<strong className="text-slate-800">{application.pref2}</strong>). Our Secretariat selection committee is vetting details. You will be contacted on <strong className="text-slate-800">{application.phone}</strong> for interviews.
                      </p>
                      <div className="mt-5 text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> Submitted on {new Date(application.submittedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. INTERVIEW STATUS */}
                {application.status === 'interview' && (
                  <div className="flex flex-col md:flex-row items-start gap-6 w-full">
                    <div className="bg-indigo-100 border border-indigo-200 p-4 rounded-xl text-indigo-600 shrink-0">
                      <Users className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Stage 2: Shortlisted for Interview
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-3">Congratulations! You are shortlisted for the interview round</h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        Our recruitment coordinators are reviewing your credentials. An online interview scheduling invite will be shared via email shortly.
                      </p>
                      <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 w-full">
                        <h4 className="text-xs font-bold text-slate-800">Preparation Guidelines:</h4>
                        <ul className="space-y-1.5 text-[11px] text-slate-500">
                          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-600" /> Be ready to discuss your preference: <strong className="text-slate-700">{application.pref1}</strong></li>
                          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-600" /> Review your Statement of Purpose (SOP)</li>
                          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-600" /> Ensure a stable audio/video setup for the meeting</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ONBOARDING DOCUMENTS STATUS */}
                {(application.status === 'onboarding' || application.status === 'approved') && (
                  <div className="w-full">
                    <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                      <div className="bg-emerald-100 border border-emerald-200 p-4 rounded-xl text-emerald-600 shrink-0">
                        <UserCheck className="h-8 w-8" />
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Stage 3: Upload Onboarding Documents
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-3">Interview Cleared! Please submit your details</h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          Great job clearing the interview round! To prepare your formal appointment letter and Non-Disclosure Agreement (NDA), we require copy validations of your credentials.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleDocumentsSubmit} className="space-y-4 pt-4 border-t border-slate-200 w-full">
                      {docsError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 animate-pulse" /> {docsError}
                        </div>
                      )}

                      <div className="grid md:grid-cols-3 gap-4">
                        {/* College ID */}
                        <div className="border border-slate-200 bg-white rounded-xl p-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Document 1</span>
                            <h4 className="text-xs font-bold text-slate-800 mt-1">College/School Student ID</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Vetted enrollment validation</p>
                          </div>
                          <div className="mt-4">
                            <input 
                              type="file" 
                              id="file-input-collegeId"
                              className="hidden" 
                              accept="image/*,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleRealUpload('collegeId', file)
                                }
                              }}
                            />
                            {docFiles.collegeId ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                                  <span className="truncate max-w-[120px]">{docFiles.collegeId.startsWith('blob:') || docFiles.collegeId.startsWith('http') ? 'ID Card Uploaded' : docFiles.collegeId}</span>
                                  <Check className="h-4 w-4" />
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1">
                                  <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${docsProgress.collegeId}%` }}></div>
                                </div>
                              </div>
                            ) : (
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => document.getElementById('file-input-collegeId')?.click()}
                                className="w-full text-xs h-9 cursor-pointer"
                              >
                                Upload ID Card
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Aadhar Card */}
                        <div className="border border-slate-200 bg-white rounded-xl p-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Document 2</span>
                            <h4 className="text-xs font-bold text-slate-800 mt-1">Aadhar Card / Gov ID</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Permanent identity validation</p>
                          </div>
                          <div className="mt-4">
                            <input 
                              type="file" 
                              id="file-input-aadhar"
                              className="hidden" 
                              accept="image/*,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleRealUpload('aadhar', file)
                                }
                              }}
                            />
                            {docFiles.aadhar ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                                  <span className="truncate max-w-[120px]">{docFiles.aadhar.startsWith('blob:') || docFiles.aadhar.startsWith('http') ? 'Gov ID Uploaded' : docFiles.aadhar}</span>
                                  <Check className="h-4 w-4" />
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1">
                                  <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${docsProgress.aadhar}%` }}></div>
                                </div>
                              </div>
                            ) : (
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => document.getElementById('file-input-aadhar')?.click()}
                                className="w-full text-xs h-9 cursor-pointer"
                              >
                                Upload Gov ID
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Profile Photo */}
                        <div className="border border-slate-200 bg-white rounded-xl p-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Document 3</span>
                            <h4 className="text-xs font-bold text-slate-800 mt-1">Official Profile Photo</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">High-res professional headshot</p>
                          </div>
                          <div className="mt-4">
                            <input 
                              type="file" 
                              id="file-input-photo"
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleRealUpload('photo', file)
                                }
                              }}
                            />
                            {docFiles.photo ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                                  <span className="truncate max-w-[120px]">{docFiles.photo.startsWith('blob:') || docFiles.photo.startsWith('http') ? 'Photo Uploaded' : docFiles.photo}</span>
                                  <Check className="h-4 w-4" />
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1">
                                  <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${docsProgress.photo}%` }}></div>
                                </div>
                              </div>
                            ) : (
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => document.getElementById('file-input-photo')?.click()}
                                className="w-full text-xs h-9 cursor-pointer"
                              >
                                Upload Photo
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t w-full">
                        <Button
                          type="submit"
                          disabled={uploadingDocs || !docFiles.collegeId || !docFiles.aadhar || !docFiles.photo || docsProgress.collegeId < 100 || docsProgress.aadhar < 100 || docsProgress.photo < 100}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-6 py-2.5 h-10 rounded-lg cursor-pointer flex items-center gap-2"
                        >
                          {uploadingDocs ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                            </>
                          ) : (
                            <>
                              Submit & Move to NDA Agreement <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 4. NDA CONTRACT SIGNING STATUS */}
                {application.status === 'contract' && (
                  <div className="w-full">
                    <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                      <div className="bg-indigo-100 border border-indigo-200 p-4 rounded-xl text-indigo-600 shrink-0">
                        <FileText className="h-8 w-8" />
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Stage 4: Sign Executive Contract & NDA
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-3">Non-Disclosure Agreement (NDA) & Committee Contract</h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          Please carefully read the following binding contract. You must accept the provisions and digitally sign to finalize your onboarding.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-300 text-[11px] font-mono leading-relaxed h-52 overflow-y-auto shadow-inner mb-6 space-y-3">
                      <h4 className="text-white font-bold text-xs border-b border-slate-800 pb-2">KIMUN 2026 ORGANIZING COMMITTEE CONTRACT & NON-DISCLOSURE AGREEMENT</h4>
                      <p><strong>1. PURPOSE:</strong> The Disclosing Party (KIMUN Secretariat) is granting the Candidate access to operational frameworks, registration matrices, financial details, and delegate databases for the execution of KIMUN 2026.</p>
                      <p><strong>2. CONFIDENTIALITY PROTOCOLS:</strong> All materials, email lists, contact parameters, software integrations, and design files remain the exclusive property of KIMUN. The Candidate shall not reproduce, share, or disseminate any proprietary resources to third parties without prior written consent.</p>
                      <p><strong>3. CODE OF CONDUCT:</strong> Candidates must maintain a high standard of professional ethics. You are expected to deliver tasks on time as assigned under your respective department parameters. Misconduct or security leaks will result in termination of this appointment and potential legal enforcement.</p>
                      <p><strong>4. TERM:</strong> This agreement is active from the date of digital authorization until the completion of KIMUN 2026 post-event administrative clearance.</p>
                    </div>

                    <form onSubmit={handleNDASign} className="space-y-4 pt-4 border-t w-full">
                      {signingError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> {signingError}
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="nda-checkbox"
                          checked={ndaAgreed}
                          onChange={(e) => setNdaAgreed(e.target.checked)}
                          className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor="nda-checkbox" className="text-xs text-slate-600 select-none cursor-pointer">
                          I agree to keep all data confidential and adhere strictly to the KIMUN 2026 code of conduct.
                        </label>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 items-end bg-white border rounded-xl p-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name Signature</label>
                          <input
                            type="text"
                            placeholder="Type full name to sign"
                            value={signatureText}
                            onChange={(e) => setSignatureText(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="border border-dashed border-indigo-100 bg-indigo-50/20 rounded-lg p-3 text-center h-12 flex items-center justify-center">
                          {signatureText ? (
                            <span className="font-serif italic text-indigo-600 text-lg tracking-wider font-extrabold select-none">
                              {signatureText}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Signature Preview</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t w-full">
                        <Button
                          type="submit"
                          disabled={signing || !ndaAgreed || !signatureText.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-6 py-2.5 h-10 rounded-lg cursor-pointer flex items-center gap-2"
                        >
                          {signing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Recording Signature...
                            </>
                          ) : (
                            <>
                              Sign & Request Credentials <Check className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 5. WELCOMED STATUS */}
                {application.status === 'welcomed' && (
                  <div className="w-full text-center py-6 space-y-6">
                    <div className="w-20 h-20 bg-indigo-50 border-4 border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                      <Sparkles className="h-10 w-10" />
                    </div>
                    <div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Official Committee Member
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mt-4">Welcome to KIMUN 2026, {user.displayName}!</h2>
                      <p className="text-xs text-slate-600 max-w-xl mx-auto mt-2 leading-relaxed">
                        You have successfully completed the onboarding pipeline. Your NDA contract is signed and security credentials have been granted.
                      </p>
                    </div>

                    <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-5 text-left space-y-3.5 shadow-sm">
                      <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-bold text-slate-400 uppercase">Department</span><span className="text-xs font-bold text-indigo-600">{application.pref1}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-bold text-slate-400 uppercase">Status</span><span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Fully Vetted</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-bold text-slate-400 uppercase">NDA Signed</span><span className="text-xs text-slate-600">{new Date(application.contractSignedAt || new Date()).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span></div>
                      <div className="flex justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase">Digital Signature</span><span className="text-xs font-serif italic font-black text-indigo-700">{application.signature || user.displayName}</span></div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center w-full">
                      <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer">
                        <Link href="/oc-dashboard">
                          Go to OC Dashboard <ArrowRight className="h-4.5 w-4.5" />
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-6 py-2.5 rounded-lg transition-colors cursor-pointer">
                        <a href="https://slack.com" target="_blank" rel="noopener noreferrer">
                          Join Executive Slack
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {/* 6. REJECTED STATUS */}
                {application.status === 'rejected' && (
                  <div className="flex flex-col md:flex-row items-start gap-6 w-full">
                    <div className="bg-rose-100 border border-rose-200 p-4 rounded-xl text-rose-600 shrink-0">
                      <XCircle className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Application Vetted
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-3">Application Status Update</h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        Thank you for your interest and the effort put into applying for the KIMUN 2026 Organizing Committee. Due to strict slot parameters and high volume, we are unable to accept your application at this time. We encourage you to participate as a delegate or observer in the upcoming conferences.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Multi-step Application Wizard */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-8">
                <div>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Organizing Committee Onboarding</p>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">Submit Application</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold text-slate-900">{user.displayName}</p>
                    <p className="text-[10px] text-slate-400">{user.email}</p>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-50 p-2 h-9 w-9 rounded-lg"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress Steps Header */}
              <div className="mb-10">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 relative">
                  {/* Step Connection Bar */}
                  <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-100 -z-10">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${((step - 1) / 2) * 100}%` }}
                    ></div>
                  </div>

                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${step > 1
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : step === 1
                          ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                      {step > 1 ? <Check className="h-4 w-4" /> : "1"}
                    </div>
                    <span className={step === 1 ? 'text-indigo-600 font-bold' : ''}>Personal Info</span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${step > 2
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : step === 2
                          ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                      {step > 2 ? <Check className="h-4 w-4" /> : "2"}
                    </div>
                    <span className={step === 2 ? 'text-indigo-600 font-bold' : ''}>Department Choices</span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${step === 3
                        ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50'
                        : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                      3
                    </div>
                    <span className={step === 3 ? 'text-indigo-600 font-bold' : ''}>SOP & Resume</span>
                  </div>
                </div>
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Full Name</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${formErrors.name ? 'border-red-300 bg-red-50/10' : 'border-slate-200'
                              }`}
                          />
                          {formErrors.name && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {formErrors.name}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Phone Number</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+91 XXXXX XXXXX"
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${formErrors.phone ? 'border-red-300 bg-red-50/10' : 'border-slate-200'
                              }`}
                          />
                          {formErrors.phone && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {formErrors.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">College / Institution</label>
                          <input
                            type="text"
                            name="college"
                            value={formData.college}
                            onChange={handleInputChange}
                            placeholder="University / College Name"
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${formErrors.college ? 'border-red-300 bg-red-50/10' : 'border-slate-200'
                              }`}
                          />
                          {formErrors.college && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {formErrors.college}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Year of Study</label>
                          <select
                            name="year"
                            value={formData.year}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
                          >
                            <option value="1st">1st Year</option>
                            <option value="2nd">2nd Year</option>
                            <option value="3rd">3rd Year</option>
                            <option value="4th">4th Year</option>
                            <option value="PG">Postgraduate</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Course / Field of Study</label>
                        <input
                          type="text"
                          name="course"
                          value={formData.course}
                          onChange={handleInputChange}
                          placeholder="e.g. B.Tech Computer Science, B.A. Political Science"
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${formErrors.course ? 'border-red-300 bg-red-50/10' : 'border-slate-200'
                            }`}
                        />
                        {formErrors.course && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {formErrors.course}</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">First Choice Department</label>
                          <select
                            name="pref1"
                            value={formData.pref1}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer ${formErrors.pref1 ? 'border-red-300 bg-red-50/10' : 'border-slate-200'
                              }`}
                          >
                            <option value="">Select a Department</option>
                            {DEPARTMENTS.map((dept, idx) => (
                              <option key={idx} value={dept}>{dept}</option>
                            ))}
                          </select>
                          {formErrors.pref1 && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {formErrors.pref1}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Second Choice Department</label>
                          <select
                            name="pref2"
                            value={formData.pref2}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer ${formErrors.pref2 ? 'border-red-300 bg-red-50/10' : 'border-slate-200'
                              }`}
                          >
                            <option value="">Select a Department</option>
                            {DEPARTMENTS.map((dept, idx) => (
                              <option key={idx} value={dept}>{dept}</option>
                            ))}
                          </select>
                          {formErrors.pref2 && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {formErrors.pref2}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          MUN / Organizing Experience <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                          name="experience"
                          rows={4}
                          value={formData.experience}
                          onChange={handleInputChange}
                          placeholder="Summarize past Model United Nations participation, leadership roles, or organizing experience in college events."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Statement of Purpose <span className="text-slate-400 font-bold lowercase text-[10px]">(Min 50 characters)</span>
                        </label>
                        <textarea
                          name="statement"
                          rows={5}
                          value={formData.statement}
                          onChange={handleInputChange}
                          placeholder="Why do you wish to join the KIMUN 2026 Organizing Committee? Highlight what value you can offer to your chosen departments."
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none ${formErrors.statement ? 'border-red-300 bg-red-50/10' : 'border-slate-200'
                            }`}
                        />
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          {formErrors.statement ? (
                            <p className="text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {formErrors.statement}</p>
                          ) : (
                            <span className="text-slate-400">Be descriptive and authentic</span>
                          )}
                          <span className={formData.statement.trim().length >= 50 ? "text-indigo-600 font-bold" : "text-slate-400"}>
                            {formData.statement.trim().length} chars
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Resume Link</label>
                        <input
                          type="url"
                          name="resume"
                          value={formData.resume}
                          onChange={handleInputChange}
                          placeholder="Google Drive, Dropbox, or OneDrive shareable link"
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${formErrors.resume ? 'border-red-300 bg-red-50/10' : 'border-slate-200'
                            }`}
                        />
                        <div className="flex items-center justify-between mt-1.5 text-[10px]">
                          {formErrors.resume ? (
                            <p className="text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {formErrors.resume}</p>
                          ) : (
                            <span className="text-slate-400">Ensure link permissions are set to &quot;Anyone with the link can view&quot;</span>
                          )}
                        </div>
                      </div>

                      {submitError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{submitError}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                  {step > 1 ? (
                    <Button
                      type="button"
                      onClick={prevStep}
                      variant="outline"
                      className="border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </Button>
                  ) : (
                    <div></div> // Empty spacer to push &quot;Next&quot; to right
                  )}

                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      Next Step <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          Submit Application <Check className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-12 text-center">
            Direct any credential verification questions to our administrative line at{' '}
            <a href="mailto:info@kimun.in.net" className="text-indigo-600 hover:underline font-semibold transition-colors">
              info@kimun.in.net
            </a>
          </p>
        </motion.section>
      </main>
    </div>
  )
}
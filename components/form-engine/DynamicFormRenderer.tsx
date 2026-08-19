// components/form-engine/DynamicFormRenderer.tsx
import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FormSchema, FormSection } from '@/types/form-engine'
import { FormFieldRenderer } from './FormFieldRenderer'
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Lock,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Loader2,
  LogOut,
  User,
  ArrowRight
} from 'lucide-react'
import { firebaseAuth, firebaseDb, googleProvider } from '@/lib/firebase-client'
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { ref, push, set } from 'firebase/database'

interface DynamicFormRendererProps {
  schema: FormSchema
  onSuccess?: (submissionId: string) => void
}

export function DynamicFormRenderer({ schema, onSuccess }: DynamicFormRendererProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<string>('')
  const [couponDiscount, setCouponDiscount] = useState<number>(0)

  // Auth observer
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user)
      setAuthLoading(false)
      if (user) {
        setFormData((prev) => ({
          ...prev,
          email: prev.email || user.email || '',
          full_name: prev.full_name || prev.name || user.displayName || '',
        }))
      }
    })
    return () => unsub()
  }, [])

  // Load draft from localStorage
  useEffect(() => {
    if (!schema?.id) return
    const draft = localStorage.getItem(`form_draft_${schema.id}`)
    if (draft) {
      try {
        setFormData((prev) => ({ ...JSON.parse(draft), ...prev }))
      } catch (e) {
        console.error('Failed to parse form draft', e)
      }
    }
  }, [schema?.id])

  // Auto-save draft on changes
  useEffect(() => {
    if (schema?.id && Object.keys(formData).length > 0) {
      localStorage.setItem(`form_draft_${schema.id}`, JSON.stringify(formData))
    }
  }, [formData, schema?.id])

  const sections: FormSection[] = schema.sections || []
  const currentSection = sections[currentStep] || sections[0]

  // Calculate live dynamic total amount
  const totalAmount = useMemo(() => {
    if (!schema.paymentConfig?.enabled) return 0
    let total = schema.paymentConfig.baseAmount || 0

    // Add dynamic pricing options
    sections.forEach((sec) => {
      sec.fields.forEach((f) => {
        if (f.options && formData[f.id]) {
          const selectedVal = formData[f.id]
          const matchedOpt = f.options.find((o) => o.value === selectedVal)
          if (matchedOpt?.priceDelta) {
            total += matchedOpt.priceDelta
          }
        }
      })
    })

    return Math.max(0, total - couponDiscount)
  }, [schema.paymentConfig, sections, formData, couponDiscount])

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  const validateCurrentStep = (): boolean => {
    if (!currentSection) return true
    const newErrors: Record<string, string> = {}

    currentSection.fields.forEach((field) => {
      // If hidden by conditional logic, skip
      if (field.conditionalLogic) {
        const { targetFieldId, operator, value } = field.conditionalLogic
        const currentTargetVal = formData[targetFieldId]
        let isVisible = true
        if (operator === 'equals') isVisible = currentTargetVal === value
        else if (operator === 'not_equals') isVisible = currentTargetVal !== value
        if (!isVisible) return
      }

      const val = formData[field.id]
      if (field.validation?.required) {
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          newErrors[field.id] = field.validation.customErrorMessage || `${field.label} is required`
        }
      }

      if (field.type === 'email' && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(val)) {
          newErrors[field.id] = 'Please enter a valid email address'
        }
      }

      if (field.type === 'phone' && val) {
        const clean = val.toString().replace(/[^0-9+]/g, '')
        if (clean.length < 8) {
          newErrors[field.id] = 'Please enter a valid phone number'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < sections.length - 1) {
        setCurrentStep((prev) => prev + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        handleSubmitForm()
      }
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmitForm = async () => {
    setIsSubmitting(true)
    try {
      const submissionsRef = ref(firebaseDb, `form_submissions/${schema.id}`)
      const newSubRef = push(submissionsRef)
      const subId = newSubRef.key || `sub_${Date.now()}`

      const payload = {
        id: subId,
        formId: schema.id,
        formSlug: schema.slug,
        organizationId: schema.organizationId || 'kimun_default',
        userId: currentUser?.uid || null,
        userEmail: currentUser?.email || formData.email || null,
        userName: currentUser?.displayName || formData.full_name || formData.name || null,
        userPhone: formData.phone || null,
        responses: formData,
        paymentStatus: schema.paymentConfig?.enabled ? 'pending' : 'none',
        paymentAmount: totalAmount,
        currency: schema.paymentConfig?.currency || 'INR',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }

      await set(newSubRef, payload)

      // Send confirmation receipt email
      if (schema.notificationConfig?.sendApplicantReceipt && formData.email) {
        fetch('/api/sendApplicationEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.full_name || formData.name || 'Participant',
            type: 'receipt',
            role: schema.title,
          }),
        }).catch((e) => console.error('Email error:', e))
      }

      localStorage.removeItem(`form_draft_${schema.id}`)
      setSubmissionId(subId)
      setIsSubmitted(true)
      if (onSuccess) onSuccess(subId)
    } catch (err: any) {
      console.error('Submission failed:', err)
      alert('Failed to submit form: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Theme styling helpers
  const bgStyles = {
    dark_glass: 'bg-slate-950 text-white min-h-screen',
    midnight_blue: 'bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white min-h-screen',
    luxury_light: 'bg-slate-50 text-slate-900 min-h-screen',
    gradient_sunset: 'bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white min-h-screen',
  }[schema.themeConfig?.backgroundStyle || 'dark_glass']

  if (schema.requireAuth && !currentUser && !authLoading) {
    return (
      <div className={`${bgStyles} flex flex-col items-center justify-center p-6 text-center`}>
        <div className="max-w-md w-full p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">{schema.title}</h2>
            <p className="text-sm text-slate-400 mt-2">
              Authentication is required to ensure secure submission verification.
            </p>
          </div>
          <button
            type="button"
            onClick={() => signInWithPopup(firebaseAuth, googleProvider)}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-100 transition-all shadow-lg shadow-white/10"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className={`${bgStyles} flex flex-col items-center justify-center p-6 text-center`}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg w-full p-8 sm:p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Submitted Successfully
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-3">
              Thank You!
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              Your response has been registered. Reference ID:{' '}
              <strong className="text-white font-mono">{submissionId}</strong>
            </p>
          </div>

          {schema.paymentConfig?.enabled && totalAmount > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Total Payable:</span>
                <span className="text-base font-bold text-white">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-indigo-300">
                Payment confirmation receipt has been sent to your email.
              </p>
            </div>
          )}

          <div className="pt-4">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              Back to Home
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={bgStyles}>
      {/* Top Header */}
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-indigo-600/30">
              ⚡
            </div>
            <div>
              <h1 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {schema.title}
              </h1>
              <p className="text-[11px] text-slate-400">
                Step {currentStep + 1} of {sections.length}: {currentSection?.title}
              </p>
            </div>
          </div>

          {currentUser && (
            <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate max-w-[120px]">{currentUser.displayName || currentUser.email}</span>
              <button
                type="button"
                onClick={() => signOut(firebaseAuth)}
                className="text-slate-400 hover:text-rose-400 ml-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Step Progress Pills */}
        {sections.length > 1 && (
          <div className="flex items-center justify-between gap-2 mb-8 overflow-x-auto pb-2">
            {sections.map((sec, idx) => {
              const isPast = idx < currentStep
              const isCurrent = idx === currentStep
              return (
                <div
                  key={sec.id}
                  className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-all shrink-0 ${
                    isPast
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isCurrent
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-white/5 text-slate-400 border border-white/5'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-white/20">
                    {isPast ? '✓' : idx + 1}
                  </span>
                  <span>{sec.title}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Section Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
          <div className="mb-6 pb-4 border-b border-white/10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {currentSection?.title}
            </h2>
            {currentSection?.subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {currentSection.subtitle}
              </p>
            )}
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-12 gap-5">
            {currentSection?.fields.map((field) => (
              <FormFieldRenderer
                key={field.id}
                field={field}
                value={formData[field.id]}
                onChange={handleFieldChange}
                error={errors[field.id]}
                formData={formData}
              />
            ))}
          </div>

          {/* Payment Summary Footer if last step and payment enabled */}
          {currentStep === sections.length - 1 && schema.paymentConfig?.enabled && (
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-950/30 p-5 rounded-2xl border border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                    Registration Fee
                  </p>
                  <p className="text-xl font-bold text-white">
                    ₹{totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-400 text-right">
                <span>Secure SSL Encrypted Checkout</span>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-white/10">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : currentStep === sections.length - 1 ? (
                <>
                  Submit Application
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

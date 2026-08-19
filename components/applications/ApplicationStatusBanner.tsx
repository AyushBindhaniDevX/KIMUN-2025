// components/applications/ApplicationStatusBanner.tsx
import React from 'react'
import {
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  XCircle,
  FileCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react'

export type ApplicationStatus = 'pending' | 'review' | 'interview' | 'onboarding' | 'welcomed' | 'rejected' | string

interface ApplicationStatusBannerProps {
  status: ApplicationStatus
  applicantName?: string
  roleTitle?: string
  departmentOrCommittee?: string
  appliedDate?: string
  onboardingActionUrl?: string
  onboardingActionText?: string
  interviewActionUrl?: string
  interviewActionText?: string
  notes?: string
}

export function ApplicationStatusBanner({
  status = 'pending',
  applicantName,
  roleTitle = 'Organizing Committee Member',
  departmentOrCommittee,
  appliedDate,
  onboardingActionUrl,
  onboardingActionText = 'Complete Onboarding',
  interviewActionUrl,
  interviewActionText = 'View Interview Details',
  notes,
}: ApplicationStatusBannerProps) {
  const normStatus = status.toLowerCase()

  const config = {
    welcomed: {
      bg: 'bg-gradient-to-r from-emerald-900/90 to-teal-950 text-white border-emerald-500/30',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: Sparkles,
      iconColor: 'text-emerald-400',
      title: 'Appointment Confirmed & Welcomed',
      message: 'Congratulations! Your appointment is official. You now have full access to the Oasis Workspace and department channels.',
    },
    onboarding: {
      bg: 'bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white border-indigo-500/30',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: FileCheck,
      iconColor: 'text-indigo-400',
      title: 'Onboarding in Progress',
      message: 'You have advanced to onboarding! Please submit your code of conduct confirmation and access details to activate your role.',
    },
    interview: {
      bg: 'bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 text-white border-amber-500/30',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Clock,
      iconColor: 'text-amber-400',
      title: 'Selected for Interview',
      message: 'You have been shortlisted for an interview round. Our Secretariat will contact you via email/WhatsApp with the scheduling link.',
    },
    rejected: {
      bg: 'bg-gradient-to-r from-rose-950 to-slate-950 text-white border-rose-500/30',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: XCircle,
      iconColor: 'text-rose-400',
      title: 'Application Not Selected',
      message: 'Thank you for your interest and time. While we were unable to offer a position this cycle, we encourage you to participate in upcoming delegations.',
    },
    pending: {
      bg: 'bg-gradient-to-r from-slate-900 to-slate-950 text-white border-slate-700/50',
      badgeBg: 'bg-slate-700/50 text-slate-300 border-slate-600',
      icon: Clock,
      iconColor: 'text-sky-400',
      title: 'Under Secretariat Review',
      message: 'Your application has been received and is currently being evaluated by the KIMUN Executive Board.',
    },
  }[normStatus] || {
    bg: 'bg-gradient-to-r from-slate-900 to-slate-950 text-white border-slate-700/50',
    badgeBg: 'bg-slate-700/50 text-slate-300 border-slate-600',
    icon: Clock,
    iconColor: 'text-sky-400',
    title: 'Application Received',
    message: 'Your application is currently active in our registry.',
  }

  const Icon = config.icon

  const steps = [
    { key: 'applied', label: 'Applied' },
    { key: 'interview', label: 'Interview' },
    { key: 'onboarding', label: 'Onboarding' },
    { key: 'welcomed', label: 'Official Member' },
  ]

  const getStepStatus = (stepKey: string) => {
    if (normStatus === 'rejected') return 'failed'
    if (normStatus === 'welcomed') return 'completed'
    if (normStatus === 'onboarding') {
      return stepKey === 'welcomed' ? 'upcoming' : 'completed'
    }
    if (normStatus === 'interview') {
      return stepKey === 'applied' || stepKey === 'interview' ? 'current' : 'upcoming'
    }
    return stepKey === 'applied' ? 'completed' : 'upcoming'
  }

  return (
    <div className={`rounded-2xl p-6 sm:p-8 border shadow-xl relative overflow-hidden ${config.bg}`}>
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${config.badgeBg}`}>
              Status: {normStatus.toUpperCase()}
            </span>
            {departmentOrCommittee && (
              <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                {departmentOrCommittee}
              </span>
            )}
            {appliedDate && (
              <span className="text-xs text-slate-400">
                Applied on {appliedDate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Icon className={`w-6 h-6 ${config.iconColor} shrink-0`} />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {config.title}
            </h2>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed">
            {config.message}
          </p>

          {notes && (
            <div className="mt-3 p-3 rounded-lg bg-black/20 border border-white/5 text-xs text-slate-300">
              <strong className="text-white">Admin Note:</strong> {notes}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex flex-col sm:flex-row gap-3">
          {normStatus === 'onboarding' && onboardingActionUrl && (
            <a
              href={onboardingActionUrl}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 transition-all"
            >
              {onboardingActionText}
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
          {normStatus === 'interview' && interviewActionUrl && (
            <a
              href={interviewActionUrl}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/30 transition-all"
            >
              {interviewActionText}
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
          {normStatus === 'welcomed' && (
            <a
              href="/oasis"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/30 transition-all"
            >
              Open Oasis Hub
              <ChevronRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Progress Steps Timeline */}
      {normStatus !== 'rejected' && (
        <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step, idx) => {
              const stepStatus = getStepStatus(step.key)
              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1.5 transition-colors ${
                      stepStatus === 'completed'
                        ? 'bg-emerald-400 text-slate-950'
                        : stepStatus === 'current'
                        ? 'bg-amber-400 text-slate-950 animate-pulse'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {stepStatus === 'completed' ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-medium hidden sm:inline ${
                      stepStatus === 'completed' || stepStatus === 'current'
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

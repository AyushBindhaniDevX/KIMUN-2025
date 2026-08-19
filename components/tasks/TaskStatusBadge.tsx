// components/tasks/TaskStatusBadge.tsx
import React from 'react'

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'under_review' | string
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | string

interface TaskStatusBadgeProps {
  status?: TaskStatus
  className?: string
}

interface TaskPriorityBadgeProps {
  priority?: TaskPriority
  className?: string
}

export function TaskStatusBadge({ status = 'todo', className = '' }: TaskStatusBadgeProps) {
  const normStatus = status.toLowerCase()
  
  if (normStatus === 'completed') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Completed
      </span>
    )
  }

  if (normStatus === 'in_progress' || normStatus === 'in progress') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
        In Progress
      </span>
    )
  }

  if (normStatus === 'under_review') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        Under Review
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      To Do
    </span>
  )
}

export function TaskPriorityBadge({ priority = 'medium', className = '' }: TaskPriorityBadgeProps) {
  const normPriority = priority.toLowerCase()

  if (normPriority === 'urgent' || normPriority === 'high') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
        {priority}
      </span>
    )
  }

  if (normPriority === 'medium') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 ${className}`}>
        Medium
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200 ${className}`}>
      Low
    </span>
  )
}

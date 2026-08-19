// components/tasks/TaskCard.tsx
import React from 'react'
import { Calendar, User, Award, CheckCircle2, Clock, Trash2, Edit, AlertCircle } from 'lucide-react'
import { TaskStatusBadge, TaskPriorityBadge } from './TaskStatusBadge'

export interface TaskItem {
  id: string
  title: string
  description?: string
  department?: string
  priority?: string
  dueDate?: string
  assignee?: string
  status?: string
  maxPoints?: number
  awardedPoints?: number
  verified?: boolean
  notes?: string
  remarks?: string
  attachments?: string
  createdAt?: string
  createdBy?: string
}

interface TaskCardProps {
  task: TaskItem
  currentUserEmail?: string
  currentUserName?: string
  onStatusChange?: (taskId: string, newStatus: string) => void
  onClaim?: (taskId: string, currentAssignee?: string) => void
  onEdit?: (task: TaskItem) => void
  onDelete?: (task: TaskItem) => void
  onVerify?: (task: TaskItem) => void
  showDepartment?: boolean
}

export function TaskCard({
  task,
  currentUserEmail,
  currentUserName,
  onStatusChange,
  onClaim,
  onEdit,
  onDelete,
  onVerify,
  showDepartment = false,
}: TaskCardProps) {
  const isClaimedByMe =
    task.assignee &&
    (task.assignee.toLowerCase() === currentUserName?.toLowerCase() ||
      task.assignee.toLowerCase() === currentUserEmail?.toLowerCase())

  const isCompleted = task.status === 'completed'
  const isAllDept = task.assignee === 'ALL'

  return (
    <div className="group relative bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:border-slate-300 flex flex-col justify-between">
      <div>
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <TaskPriorityBadge priority={task.priority} />
            <TaskStatusBadge status={task.status} />
            {showDepartment && task.department && (
              <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                {task.department}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                title="Edit Task"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h4 className="font-semibold text-slate-900 text-sm leading-snug mb-1">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed mb-3">
            {task.description}
          </p>
        )}
      </div>

      {/* Meta details & Actions */}
      <div className="pt-3 border-t border-slate-100 mt-2 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
          {task.dueDate ? (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{task.dueDate}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>No due date</span>
            </div>
          )}

          {task.maxPoints !== undefined && task.maxPoints > 0 && (
            <div className="flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              <Award className="w-3 h-3" />
              <span>{task.verified ? `Awarded: ${task.awardedPoints} pts` : `Up to ${task.maxPoints} pts`}</span>
            </div>
          )}
        </div>

        {/* Assignee & Claim */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1.5 text-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium truncate max-w-[140px]">
              {isAllDept ? '🌐 All Members' : task.assignee || 'Unassigned'}
            </span>
          </div>

          {onClaim && !isAllDept && (
            <button
              type="button"
              onClick={() => onClaim(task.id, task.assignee)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                isClaimedByMe
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {isClaimedByMe ? 'Unclaim' : task.assignee ? 'Take Over' : 'Claim'}
            </button>
          )}
        </div>

        {/* Status Transition Quick Buttons */}
        {onStatusChange && (
          <div className="flex items-center gap-1.5 pt-1">
            {task.status !== 'todo' && (
              <button
                type="button"
                onClick={() => onStatusChange(task.id, 'todo')}
                className="flex-1 text-[10px] font-semibold py-1 px-2 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-center transition-colors"
              >
                To Do
              </button>
            )}
            {task.status !== 'in_progress' && (
              <button
                type="button"
                onClick={() => onStatusChange(task.id, 'in_progress')}
                className="flex-1 text-[10px] font-semibold py-1 px-2 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-center transition-colors"
              >
                In Progress
              </button>
            )}
            {!isCompleted && (
              <button
                type="button"
                onClick={() => onStatusChange(task.id, 'completed')}
                className="flex-1 text-[10px] font-semibold py-1 px-2 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-center transition-colors"
              >
                Complete
              </button>
            )}
            {isCompleted && !task.verified && onVerify && (
              <button
                type="button"
                onClick={() => onVerify(task)}
                className="flex-1 text-[10px] font-semibold py-1 px-2 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-center transition-colors"
              >
                Verify & Award
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

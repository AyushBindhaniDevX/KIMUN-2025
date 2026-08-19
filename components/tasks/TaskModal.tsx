// components/tasks/TaskModal.tsx
import React from 'react'
import { X, Calendar, User, FileText, Award, AlertCircle } from 'lucide-react'

export interface TaskFormData {
  title: string
  description: string
  department: string
  priority: string
  dueDate: string
  assignee: string
  notes?: string
  remarks?: string
  attachments?: string
  maxPoints?: number
}

interface TaskModalProps {
  isOpen: boolean
  isEditing: boolean
  formData: TaskFormData
  departments: string[]
  assigneeOptions?: { name: string; department?: string }[]
  onChange: (data: Partial<TaskFormData>) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export function TaskModal({
  isOpen,
  isEditing,
  formData,
  departments,
  assigneeOptions = [],
  onChange,
  onSubmit,
  onClose,
}: TaskModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
              📋
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Task' : 'Assign New Task'}
              </h3>
              <p className="text-xs text-slate-500">
                Assignee will be notified instantly via email & dashboard alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Draft Sponsorship Prospectus v2"
              value={formData.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
              Description & Deliverables
            </label>
            <textarea
              rows={3}
              placeholder="Provide context, required outcomes, or links..."
              value={formData.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => onChange({ department: e.target.value })}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => onChange({ priority: e.target.value })}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
                Assignee (Name or ALL)
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe or ALL"
                value={formData.assignee}
                onChange={(e) => onChange({ assignee: e.target.value })}
                list="assignee-list"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <datalist id="assignee-list">
                <option value="ALL">ALL (Entire Department)</option>
                {assigneeOptions.map((opt, i) => (
                  <option key={i} value={opt.name}>
                    {opt.name} {opt.department ? `(${opt.department})` : ''}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => onChange({ dueDate: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
                Max Awardable Points
              </label>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="0"
                value={formData.maxPoints || 0}
                onChange={(e) => onChange({ maxPoints: parseInt(e.target.value, 10) || 0 })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
                Attachment / Link (Optional)
              </label>
              <input
                type="text"
                placeholder="https://drive.google.com/..."
                value={formData.attachments || ''}
                onChange={(e) => onChange({ attachments: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all"
            >
              {isEditing ? 'Save Changes' : 'Assign & Notify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// components/form-engine/FormFieldRenderer.tsx
import React, { useState } from 'react'
import { FormField } from '@/types/form-engine'
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileText,
  Trash2,
  Sparkles,
  DollarSign
} from 'lucide-react'
import { ref as sRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { firebaseStorage } from '@/lib/firebase-client'

interface FormFieldRendererProps {
  field: FormField
  value: any
  onChange: (fieldId: string, val: any) => void
  error?: string
  formData: Record<string, any>
}

export function FormFieldRenderer({
  field,
  value,
  onChange,
  error,
  formData,
}: FormFieldRendererProps) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Evaluate conditional logic if present
  if (field.conditionalLogic) {
    const { targetFieldId, operator, value: targetValue } = field.conditionalLogic
    const currentTargetVal = formData[targetFieldId]

    let isVisible = true
    if (operator === 'equals') isVisible = currentTargetVal === targetValue
    else if (operator === 'not_equals') isVisible = currentTargetVal !== targetValue
    else if (operator === 'contains') isVisible = Array.isArray(currentTargetVal) && currentTargetVal.includes(targetValue)
    else if (operator === 'is_empty') isVisible = !currentTargetVal || currentTargetVal === ''
    else if (operator === 'is_not_empty') isVisible = !!currentTargetVal && currentTargetVal !== ''

    if (!isVisible) return null
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const storageRef = sRef(firebaseStorage, `form_uploads/${Date.now()}_${file.name}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          setUploadProgress(progress)
        },
        (err) => {
          console.error('File upload error:', err)
          setIsUploading(false)
          setUploadProgress(null)
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
          onChange(field.id, {
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            url: downloadUrl,
          })
          setIsUploading(false)
          setUploadProgress(null)
        }
      )
    } catch (err) {
      console.error('Upload catch:', err)
      setIsUploading(false)
    }
  }

  const widthClass = {
    full: 'col-span-12',
    half: 'col-span-12 md:col-span-6',
    third: 'col-span-12 md:col-span-4',
  }[field.width || 'full']

  return (
    <div className={`${widthClass} space-y-1.5`}>
      {field.type !== 'section_header' && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {field.label}
          {field.validation?.required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      {/* TEXT / EMAIL / PHONE / NUMBER */}
      {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number') && (
        <input
          type={field.type === 'phone' ? 'tel' : field.type}
          placeholder={field.placeholder || ''}
          value={value ?? field.defaultValue ?? ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
          }`}
        />
      )}

      {/* TEXTAREA */}
      {field.type === 'textarea' && (
        <textarea
          rows={4}
          placeholder={field.placeholder || ''}
          value={value ?? field.defaultValue ?? ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y ${
            error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
          }`}
        />
      )}

      {/* DATE */}
      {field.type === 'date' && (
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      )}

      {/* SELECT */}
      {field.type === 'select' && (
        <select
          value={value ?? ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          <option value="">-- Select an option --</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} {opt.priceDelta ? `(+₹${opt.priceDelta})` : ''}
            </option>
          ))}
        </select>
      )}

      {/* RADIO / SELECTION TILES */}
      {field.type === 'radio' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {field.options?.map((opt) => {
            const isSelected = value === opt.value
            return (
              <div
                key={opt.value}
                onClick={() => onChange(field.id, opt.value)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-indigo-600' : 'border-slate-400'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                    {opt.label}
                  </p>
                  {opt.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {opt.description}
                    </p>
                  )}
                  {opt.priceDelta !== undefined && opt.priceDelta > 0 && (
                    <span className="inline-block mt-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      +₹{opt.priceDelta}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MULTISELECT / CHECKBOX GROUP */}
      {(field.type === 'multiselect' || field.type === 'checkbox') && (
        <div className="space-y-2 pt-1">
          {field.options?.map((opt) => {
            const currentArr: string[] = Array.isArray(value) ? value : []
            const isChecked = currentArr.includes(opt.value)

            const toggle = () => {
              if (isChecked) onChange(field.id, currentArr.filter((x) => x !== opt.value))
              else onChange(field.id, [...currentArr, opt.value])
            }

            return (
              <label
                key={opt.value}
                onClick={toggle}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            )
          })}
        </div>
      )}

      {/* FILE UPLOAD */}
      {field.type === 'file_upload' && (
        <div>
          {value?.url ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 truncate max-w-xs">
                    {value.name || 'Uploaded Document'}
                  </p>
                  <p className="text-[10px] text-emerald-600">{value.size || 'Ready'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChange(field.id, null)}
                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/50">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isUploading ? `Uploading... ${uploadProgress}%` : 'Click to select or drag and drop file'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {field.validation?.acceptedFileTypes?.join(', ') || 'PDF, DOCX, PNG, JPG up to 10MB'}
              </p>
              <input
                type="file"
                className="hidden"
                accept={field.validation?.acceptedFileTypes?.join(',')}
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              {uploadProgress !== null && (
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </label>
          )}
        </div>
      )}

      {/* SECTION HEADER */}
      {field.type === 'section_header' && (
        <div className="pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <h4 className="text-base font-bold text-slate-900 dark:text-white">{field.label}</h4>
          {field.helperText && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{field.helperText}</p>
          )}
        </div>
      )}

      {/* HELPER TEXT & ERROR */}
      {field.helperText && field.type !== 'section_header' && !error && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
          {field.helperText}
        </p>
      )}
      {error && (
        <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}

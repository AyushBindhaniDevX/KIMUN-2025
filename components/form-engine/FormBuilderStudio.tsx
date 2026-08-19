// components/form-engine/FormBuilderStudio.tsx
import React, { useState } from 'react'
import {
  FormField,
  FormSection,
  FormSchema,
  FormFieldType,
  FormFieldOption
} from '@/types/form-engine'
import { FORM_TEMPLATES } from '@/lib/form-templates'
import { DynamicFormRenderer } from './DynamicFormRenderer'
import {
  Plus,
  Trash2,
  Copy,
  Settings,
  Eye,
  Edit3,
  Sparkles,
  Save,
  Share2,
  Code,
  Palette,
  CreditCard,
  CheckCircle2,
  FileText,
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  List,
  CheckSquare,
  Radio,
  Calendar,
  Upload,
  Layers,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react'

interface FormBuilderStudioProps {
  initialSchema?: FormSchema
  onSave?: (schema: FormSchema) => void
  onPublish?: (schema: FormSchema) => void
}

export function FormBuilderStudio({
  initialSchema,
  onSave,
  onPublish,
}: FormBuilderStudioProps) {
  const [schema, setSchema] = useState<FormSchema>(
    initialSchema || FORM_TEMPLATES[0]
  )
  const [activeTab, setActiveTab] = useState<'build' | 'preview' | 'settings'>('build')
  const [selectedSectionIdx, setSelectedSectionIdx] = useState(0)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const currentSection = schema.sections[selectedSectionIdx] || schema.sections[0]
  const selectedField = currentSection?.fields.find((f) => f.id === selectedFieldId) || null

  const paletteItems: { type: FormFieldType; label: string; icon: any }[] = [
    { type: 'text', label: 'Single Line Text', icon: Type },
    { type: 'textarea', label: 'Multi-line Paragraph', icon: AlignLeft },
    { type: 'email', label: 'Email Address', icon: Mail },
    { type: 'phone', label: 'Phone / WhatsApp', icon: Phone },
    { type: 'number', label: 'Number Input', icon: Hash },
    { type: 'select', label: 'Dropdown Menu', icon: List },
    { type: 'radio', label: 'Radio Choices', icon: Radio },
    { type: 'multiselect', label: 'Multi Checkboxes', icon: CheckSquare },
    { type: 'date', label: 'Date Picker', icon: Calendar },
    { type: 'file_upload', label: 'File & CV Upload', icon: Upload },
    { type: 'section_header', label: 'Section Heading', icon: Layers },
  ]

  const handleAddField = (type: FormFieldType) => {
    const newFieldId = `field_${Date.now().toString().slice(-6)}`
    const newField: FormField = {
      id: newFieldId,
      type,
      label: type === 'section_header' ? 'New Section Group' : `Untitled ${type} Field`,
      placeholder: '',
      width: 'full',
      validation: { required: false },
      options:
        type === 'select' || type === 'radio' || type === 'multiselect'
          ? [
              { label: 'Option 1', value: 'opt_1' },
              { label: 'Option 2', value: 'opt_2' },
            ]
          : undefined,
    }

    setSchema((prev) => {
      const updatedSections = [...prev.sections]
      const targetSec = { ...updatedSections[selectedSectionIdx] }
      targetSec.fields = [...targetSec.fields, newField]
      updatedSections[selectedSectionIdx] = targetSec
      return { ...prev, sections: updatedSections, updatedAt: new Date().toISOString() }
    })

    setSelectedFieldId(newFieldId)
  }

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setSchema((prev) => {
      const updatedSections = prev.sections.map((sec, sIdx) => {
        if (sIdx !== selectedSectionIdx) return sec
        return {
          ...sec,
          fields: sec.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
        }
      })
      return { ...prev, sections: updatedSections, updatedAt: new Date().toISOString() }
    })
  }

  const handleDeleteField = (fieldId: string) => {
    setSchema((prev) => {
      const updatedSections = prev.sections.map((sec, sIdx) => {
        if (sIdx !== selectedSectionIdx) return sec
        return {
          ...sec,
          fields: sec.fields.filter((f) => f.id !== fieldId),
        }
      })
      return { ...prev, sections: updatedSections, updatedAt: new Date().toISOString() }
    })
    if (selectedFieldId === fieldId) setSelectedFieldId(null)
  }

  const handleMoveField = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= currentSection.fields.length) return

    setSchema((prev) => {
      const updatedSections = [...prev.sections]
      const sec = { ...updatedSections[selectedSectionIdx] }
      const fields = [...sec.fields]
      const temp = fields[idx]
      fields[idx] = fields[targetIdx]
      fields[targetIdx] = temp
      sec.fields = fields
      updatedSections[selectedSectionIdx] = sec
      return { ...prev, sections: updatedSections, updatedAt: new Date().toISOString() }
    })
  }

  const handleAddSection = () => {
    const newSec: FormSection = {
      id: `sec_${Date.now().toString().slice(-6)}`,
      title: `Step ${schema.sections.length + 1}`,
      subtitle: 'Provide step description here',
      fields: [],
    }
    setSchema((prev) => ({
      ...prev,
      sections: [...prev.sections, newSec],
      updatedAt: new Date().toISOString(),
    }))
    setSelectedSectionIdx(schema.sections.length)
  }

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/f/${schema.slug}`
    : `https://kimodelun.vercel.app/f/${schema.slug}`

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden">
      {/* Studio Top Navbar */}
      <header className="h-16 border-b border-white/10 bg-slate-900/90 px-6 flex items-center justify-between shrink-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={schema.title}
                onChange={(e) => setSchema((prev) => ({ ...prev, title: e.target.value }))}
                className="font-bold text-base bg-transparent hover:bg-white/5 px-2 py-0.5 rounded-lg border border-transparent hover:border-white/10 focus:border-indigo-500 focus:outline-none text-white max-w-sm transition-all"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {schema.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pl-2">
              Slug: <span className="font-mono text-slate-300">/f/{schema.slug}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('build')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'build' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Builder
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Templates
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            Share & Embed
          </button>

          <button
            type="button"
            onClick={() => {
              if (onPublish) onPublish(schema)
              if (onSave) onSave(schema)
              alert('Form saved & published successfully!')
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            Save & Publish
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      {activeTab === 'preview' ? (
        <div className="flex-1 overflow-y-auto">
          <DynamicFormRenderer schema={schema} />
        </div>
      ) : activeTab === 'settings' ? (
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full space-y-6">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              General Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Form Slug / URL</label>
                <input
                  type="text"
                  value={schema.slug}
                  onChange={(e) => setSchema((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
                <select
                  value={schema.status}
                  onChange={(e) => setSchema((prev) => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="published">Published (Accepting Submissions)</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
              <textarea
                rows={2}
                value={schema.description || ''}
                onChange={(e) => setSchema((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Payment & Registration Fees
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enablePayment"
                checked={schema.paymentConfig?.enabled || false}
                onChange={(e) =>
                  setSchema((prev) => ({
                    ...prev,
                    paymentConfig: {
                      enabled: e.target.checked,
                      currency: prev.paymentConfig?.currency || 'INR',
                      baseAmount: prev.paymentConfig?.baseAmount || 0,
                      paymentGateway: prev.paymentConfig?.paymentGateway || 'razorpay',
                    },
                  }))
                }
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="enablePayment" className="text-sm font-semibold text-white">
                Enable Payment Fee Collection for this form
              </label>
            </div>

            {schema.paymentConfig?.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Base Amount (₹)</label>
                  <input
                    type="number"
                    value={schema.paymentConfig.baseAmount}
                    onChange={(e) =>
                      setSchema((prev) => ({
                        ...prev,
                        paymentConfig: {
                          ...prev.paymentConfig!,
                          baseAmount: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Payment Gateway</label>
                  <select
                    value={schema.paymentConfig.paymentGateway}
                    onChange={(e) =>
                      setSchema((prev) => ({
                        ...prev,
                        paymentConfig: {
                          ...prev.paymentConfig!,
                          paymentGateway: e.target.value as any,
                        },
                      }))
                    }
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="razorpay">Razorpay Checkout</option>
                    <option value="cashfree">Cashfree Payments</option>
                    <option value="stripe">Stripe</option>
                    <option value="manual_upi">Manual UPI QR / Receipt Upload</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Field Palette */}
          <aside className="w-64 border-r border-white/10 bg-slate-900/60 p-4 overflow-y-auto shrink-0 space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Field Palette
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">Click to add a field into current step</p>
              <div className="space-y-1.5">
                {paletteItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleAddField(item.type)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-indigo-600/20 hover:border-indigo-500/40 border border-white/5 text-left text-xs font-medium text-slate-300 hover:text-white transition-all group"
                    >
                      <Icon className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                      <span>{item.label}</span>
                      <Plus className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* Center: Live Interactive Canvas */}
          <main className="flex-1 bg-slate-950 p-6 overflow-y-auto flex flex-col items-center">
            <div className="max-w-2xl w-full space-y-6">
              {/* Section Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {schema.sections.map((sec, idx) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSelectedSectionIdx(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedSectionIdx === idx
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-850 border border-white/5'
                    }`}
                  >
                    {sec.title || `Step ${idx + 1}`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-indigo-400 border border-dashed border-indigo-500/40 flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Step
                </button>
              </div>

              {/* Section Header Editor */}
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-2">
                <input
                  type="text"
                  value={currentSection?.title || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    setSchema((prev) => {
                      const updated = [...prev.sections]
                      updated[selectedSectionIdx] = { ...updated[selectedSectionIdx], title: val }
                      return { ...prev, sections: updated }
                    })
                  }}
                  placeholder="Section Title (e.g. Step 1: Personal Details)"
                  className="w-full bg-transparent text-lg font-bold text-white focus:outline-none"
                />
                <input
                  type="text"
                  value={currentSection?.subtitle || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    setSchema((prev) => {
                      const updated = [...prev.sections]
                      updated[selectedSectionIdx] = { ...updated[selectedSectionIdx], subtitle: val }
                      return { ...prev, sections: updated }
                    })
                  }}
                  placeholder="Section subtitle / instructions..."
                  className="w-full bg-transparent text-xs text-slate-400 focus:outline-none"
                />
              </div>

              {/* Field Canvas Items */}
              <div className="space-y-3">
                {currentSection?.fields.length === 0 ? (
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center text-slate-500">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-50 text-indigo-400" />
                    <p className="text-sm font-semibold text-slate-400">No fields in this step yet</p>
                    <p className="text-xs text-slate-500 mt-1">Click a field from the left palette to add it</p>
                  </div>
                ) : (
                  currentSection?.fields.map((field, idx) => {
                    const isSelected = selectedFieldId === field.id
                    return (
                      <div
                        key={field.id}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'border-indigo-500 bg-slate-900/90 shadow-xl shadow-indigo-500/10'
                            : 'border-white/5 bg-slate-900/40 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                              {field.label}
                            </span>
                            {field.validation?.required && (
                              <span className="text-rose-400 text-xs font-bold">*</span>
                            )}
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                              {field.type}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMoveField(idx, 'up')
                              }}
                              disabled={idx === 0}
                              className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMoveField(idx, 'down')
                              }}
                              disabled={idx === currentSection.fields.length - 1}
                              className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteField(field.id)
                              }}
                              className="p-1 hover:bg-rose-500/20 text-rose-400 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Dummy Input Preview */}
                        <div className="h-9 rounded-xl bg-slate-950/60 border border-white/10 px-3 flex items-center text-xs text-slate-500">
                          {field.placeholder || `[${field.type} input placeholder]`}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </main>

          {/* Right: Field Property Inspector */}
          <aside className="w-80 border-l border-white/10 bg-slate-900/60 p-4 overflow-y-auto shrink-0">
            {selectedField ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Field Inspector
                    </h4>
                    <p className="text-[10px] font-mono text-indigo-400">{selectedField.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFieldId(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Field Label</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => handleUpdateField(selectedField.id, { label: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={(e) => handleUpdateField(selectedField.id, { placeholder: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Helper Hint</label>
                  <input
                    type="text"
                    value={selectedField.helperText || ''}
                    onChange={(e) => handleUpdateField(selectedField.id, { helperText: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="reqCheckbox"
                    checked={selectedField.validation?.required || false}
                    onChange={(e) =>
                      handleUpdateField(selectedField.id, {
                        validation: { ...selectedField.validation, required: e.target.checked },
                      })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="reqCheckbox" className="text-xs font-bold text-slate-300">
                    Mandatory / Required Field
                  </label>
                </div>

                {/* Options Manager for Select/Radio/Checkbox */}
                {(selectedField.type === 'select' ||
                  selectedField.type === 'radio' ||
                  selectedField.type === 'multiselect') && (
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-400 uppercase">Choice Options</label>
                      <button
                        type="button"
                        onClick={() => {
                          const current = selectedField.options || []
                          const newOpt: FormFieldOption = {
                            label: `Option ${current.length + 1}`,
                            value: `opt_${Date.now().toString().slice(-4)}`,
                            priceDelta: 0,
                          }
                          handleUpdateField(selectedField.id, { options: [...current, newOpt] })
                        }}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Option
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedField.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const updated = [...(selectedField.options || [])]
                              updated[oIdx] = { ...updated[oIdx], label: e.target.value }
                              handleUpdateField(selectedField.id, { options: updated })
                            }}
                            className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedField.options?.filter((_, idx) => idx !== oIdx)
                              handleUpdateField(selectedField.id, { options: updated })
                            }}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <Settings className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-semibold text-slate-400">Select a field on the canvas</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Customize labels, validation, choices, and rules
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Share & Embed Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-sky-400" />
                Share & Embed Form
              </h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-400">Direct Public Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl)
                    setCopiedLink(true)
                    setTimeout(() => setCopiedLink(false), 2000)
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shrink-0"
                >
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase text-slate-400">HTML Iframe Embed Code</label>
              <textarea
                readOnly
                rows={3}
                value={`<iframe src="${publicUrl}" width="100%" height="800px" frameborder="0"></iframe>`}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-slate-300 font-mono resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Templates Picker Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Select Starter Template
              </h3>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FORM_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    setSchema(tpl)
                    setShowTemplateModal(false)
                    setSelectedSectionIdx(0)
                    setSelectedFieldId(null)
                  }}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-indigo-500 cursor-pointer transition-all space-y-2 group"
                >
                  <h4 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                    {tpl.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{tpl.description}</p>
                  <div className="flex items-center gap-2 pt-2 text-[10px] text-slate-500 font-semibold">
                    <span>{tpl.sections.length} Steps</span>
                    <span>•</span>
                    <span>{tpl.paymentConfig?.enabled ? 'Paid Registration' : 'Free Form'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

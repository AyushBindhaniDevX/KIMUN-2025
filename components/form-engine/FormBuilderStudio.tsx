// components/form-engine/FormBuilderStudio.tsx
'use client'

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
  X,
  ExternalLink,
  Lock,
  Globe,
  Sliders,
  Check,
  HelpCircle,
  GripVertical
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
  const [isSavedSuccess, setIsSavedSuccess] = useState(false)

  const currentSection = schema.sections[selectedSectionIdx] || schema.sections[0]
  const selectedField = currentSection?.fields.find((f) => f.id === selectedFieldId) || null

  const paletteCategories = [
    {
      category: 'Standard Inputs',
      items: [
        { type: 'text' as FormFieldType, label: 'Single Line Text', desc: 'Name, title, short input', icon: Type },
        { type: 'textarea' as FormFieldType, label: 'Multi-line Text', desc: 'Essays, remarks, SOP', icon: AlignLeft },
        { type: 'email' as FormFieldType, label: 'Email Address', desc: 'Validated email input', icon: Mail },
        { type: 'phone' as FormFieldType, label: 'Phone / WhatsApp', desc: 'International mobile number', icon: Phone },
        { type: 'number' as FormFieldType, label: 'Number / Age', desc: 'Quantities, experience count', icon: Hash },
      ],
    },
    {
      category: 'Choices & Options',
      items: [
        { type: 'select' as FormFieldType, label: 'Dropdown Select', desc: 'Pick single from list', icon: List },
        { type: 'radio' as FormFieldType, label: 'Radio Choices', desc: 'Visual single selection cards', icon: Radio },
        { type: 'multiselect' as FormFieldType, label: 'Multiple Checkboxes', desc: 'Select one or more', icon: CheckSquare },
        { type: 'date' as FormFieldType, label: 'Date Picker', desc: 'Birthdate, arrival date', icon: Calendar },
      ],
    },
    {
      category: 'Uploads & Layout',
      items: [
        { type: 'file_upload' as FormFieldType, label: 'File & Document', desc: 'PDF, CV, Photo upload', icon: Upload },
        { type: 'section_header' as FormFieldType, label: 'Section Header', desc: 'Visual divider & group title', icon: Layers },
      ],
    },
  ]

  const handleAddField = (type: FormFieldType) => {
    const newFieldId = `field_${Date.now().toString().slice(-6)}`
    const newField: FormField = {
      id: newFieldId,
      type,
      label: type === 'section_header' ? 'Section Heading' : `Untitled ${type.replace('_', ' ')}`,
      placeholder: type === 'section_header' ? '' : 'Enter value...',
      width: 'full',
      validation: { required: false },
      options:
        type === 'select' || type === 'radio' || type === 'multiselect'
          ? [
              { label: 'Option 1', value: 'option_1', priceDelta: 0 },
              { label: 'Option 2', value: 'option_2', priceDelta: 0 },
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

  const handleDuplicateField = (field: FormField) => {
    const newFieldId = `field_${Date.now().toString().slice(-6)}`
    const clonedField: FormField = {
      ...JSON.parse(JSON.stringify(field)),
      id: newFieldId,
      label: `${field.label} (Copy)`,
    }

    setSchema((prev) => {
      const updatedSections = [...prev.sections]
      const targetSec = { ...updatedSections[selectedSectionIdx] }
      const idx = targetSec.fields.findIndex((f) => f.id === field.id)
      targetSec.fields.splice(idx + 1, 0, clonedField)
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
      title: `Step ${schema.sections.length + 1}: Additional Information`,
      subtitle: 'Please complete the required details below.',
      fields: [],
    }
    setSchema((prev) => ({
      ...prev,
      sections: [...prev.sections, newSec],
      updatedAt: new Date().toISOString(),
    }))
    setSelectedSectionIdx(schema.sections.length)
  }

  const handleDeleteSection = (idx: number) => {
    if (schema.sections.length <= 1) {
      alert('A form must contain at least one step section.')
      return
    }
    setSchema((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx),
      updatedAt: new Date().toISOString(),
    }))
    setSelectedSectionIdx(Math.max(0, idx - 1))
  }

  const handleSaveAndPublish = () => {
    if (onPublish) onPublish(schema)
    if (onSave) onSave(schema)
    setIsSavedSuccess(true)
    setTimeout(() => setIsSavedSuccess(false), 3000)
  }

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/f/${schema.slug}`
    : `https://kimodelun.vercel.app/f/${schema.slug}`

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* Studio Top Navbar - Light Theme */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 z-40 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-100">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={schema.title}
                onChange={(e) => setSchema((prev) => ({ ...prev, title: e.target.value }))}
                className="font-bold text-base bg-transparent hover:bg-slate-50 px-2 py-0.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none text-slate-900 max-w-sm transition-all"
                title="Click to edit form title"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {schema.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pl-2 flex items-center gap-1.5">
              <span>Public URL:</span>
              <span className="font-mono text-indigo-600 font-semibold">/f/{schema.slug}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('build')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'build'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Builder
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Form Settings
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Templates
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
            Share & Embed
          </button>

          <button
            type="button"
            onClick={handleSaveAndPublish}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-sm shadow-indigo-200 transition-all"
          >
            {isSavedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Saved & Published!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Publish Form
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      {activeTab === 'preview' ? (
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <DynamicFormRenderer schema={schema} />
        </div>
      ) : activeTab === 'settings' ? (
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full space-y-6">
          {/* General Config Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              General Form Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Custom Slug / URL</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs text-slate-500 font-mono">
                    /f/
                  </span>
                  <input
                    type="text"
                    value={schema.slug}
                    onChange={(e) => setSchema((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') }))}
                    className="w-full bg-white border border-slate-200 rounded-r-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Publishing Status</label>
                <select
                  value={schema.status}
                  onChange={(e) => setSchema((prev) => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="published">Published (Live & Collecting Responses)</option>
                  <option value="draft">Draft (Private)</option>
                  <option value="archived">Archived (Closed)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Form Description & Guidelines</label>
              <textarea
                rows={3}
                value={schema.description || ''}
                onChange={(e) => setSchema((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Give applicants instructions, background or contact info..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Payment & Fees Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Payment Gateway & Registration Fees
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={schema.paymentConfig?.enabled || false}
                  onChange={(e) =>
                    setSchema((prev) => ({
                      ...prev,
                      paymentConfig: {
                        enabled: e.target.checked,
                        currency: prev.paymentConfig?.currency || 'INR',
                        baseAmount: prev.paymentConfig?.baseAmount || 0,
                        paymentGateway: prev.paymentConfig?.paymentGateway || 'razorpay',
                        allowCouponCodes: prev.paymentConfig?.allowCouponCodes ?? true,
                      },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            {schema.paymentConfig?.enabled ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Currency</label>
                  <select
                    value={schema.paymentConfig.currency}
                    onChange={(e) =>
                      setSchema((prev) => ({
                        ...prev,
                        paymentConfig: { ...prev.paymentConfig!, currency: e.target.value as any },
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Base Amount</label>
                  <input
                    type="number"
                    min="0"
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Payment Provider</label>
                  <select
                    value={schema.paymentConfig.paymentGateway}
                    onChange={(e) =>
                      setSchema((prev) => ({
                        ...prev,
                        paymentConfig: { ...prev.paymentConfig!, paymentGateway: e.target.value as any },
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="razorpay">Razorpay</option>
                    <option value="cashfree">Cashfree Payments</option>
                    <option value="stripe">Stripe</option>
                    <option value="manual_upi">Direct UPI QR / Bank Transfer</option>
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                This is currently a free application form. Enable toggle to collect payments directly on submission.
              </p>
            )}
          </div>

          {/* Theme & Styling */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-600" />
              Theme & Visual Appearance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Background Theme</label>
                <select
                  value={schema.themeConfig?.backgroundStyle || 'luxury_light'}
                  onChange={(e) =>
                    setSchema((prev) => ({
                      ...prev,
                      themeConfig: { ...prev.themeConfig!, backgroundStyle: e.target.value as any },
                    }))
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="luxury_light">Clean Enterprise Light</option>
                  <option value="dark_glass">Midnight Glass (Dark)</option>
                  <option value="midnight_blue">Deep Sapphire (Navy Blue)</option>
                  <option value="gradient_sunset">Vibrant Gradient</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Brand Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={schema.themeConfig?.primaryColor || '#4f46e5'}
                    onChange={(e) =>
                      setSchema((prev) => ({
                        ...prev,
                        themeConfig: { ...prev.themeConfig!, primaryColor: e.target.value },
                      }))
                    }
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-1"
                  />
                  <span className="text-xs font-mono text-slate-600">
                    {schema.themeConfig?.primaryColor || '#4f46e5'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Builder Viewport */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Field Palette */}
          <aside className="w-72 border-r border-slate-200 bg-white p-4 overflow-y-auto shrink-0 space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Add Form Elements
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">Click to add to the current section</p>

              <div className="space-y-5">
                {paletteCategories.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      {cat.category}
                    </span>
                    <div className="space-y-1.5">
                      {cat.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => handleAddField(item.type)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-300 text-left transition-all group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-indigo-600 group-hover:border-indigo-200 shadow-2xs transition-colors shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-950 truncate">
                                {item.label}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                            </div>
                            <Plus className="w-3.5 h-3.5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Center Canvas */}
          <main className="flex-1 bg-slate-100/70 p-6 sm:p-8 overflow-y-auto flex flex-col items-center">
            <div className="max-w-2xl w-full space-y-6">
              {/* Multi-step Section Navigation Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {schema.sections.map((sec, idx) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setSelectedSectionIdx(idx)
                      setSelectedFieldId(null)
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                      selectedSectionIdx === idx
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        selectedSectionIdx === idx ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[140px]">{sec.title || `Step ${idx + 1}`}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-dashed border-indigo-300 text-xs font-bold text-indigo-600 flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Step
                </button>
              </div>

              {/* Main Section Canvas Container */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                {/* Section Title & Subtitle Inline Editor */}
                <div className="pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
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
                      placeholder="Step Section Title (e.g. Personal Information)"
                      className="w-full text-lg font-bold text-slate-900 bg-transparent hover:bg-slate-50 px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
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
                      placeholder="Add helpful instructions or guidelines for this section..."
                      className="w-full text-xs text-slate-500 bg-transparent hover:bg-slate-50 px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  {schema.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(selectedSectionIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Step Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Field Cards on Canvas */}
                <div className="space-y-3">
                  {currentSection?.fields.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50/50">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3 text-indigo-600">
                        <Layers className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">No fields added to this step yet</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        Choose elements from the left palette to build this section.
                      </p>
                    </div>
                  ) : (
                    currentSection?.fields.map((field, idx) => {
                      const isSelected = selectedFieldId === field.id
                      return (
                        <div
                          key={field.id}
                          onClick={() => setSelectedFieldId(field.id)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative group ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/20 shadow-sm ring-2 ring-indigo-500/10'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                {field.label}
                              </span>
                              {field.validation?.required && (
                                <span className="text-rose-500 font-bold text-xs">*</span>
                              )}
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {field.type}
                              </span>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveField(idx, 'up')
                                }}
                                disabled={idx === 0}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30"
                                title="Move Up"
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
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDuplicateField(field)
                                }}
                                className="p-1 hover:bg-indigo-50 text-indigo-600 rounded"
                                title="Duplicate Field"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteField(field.id)
                                }}
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                                title="Delete Field"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Light Input Preview Placeholder */}
                          <div className="h-10 rounded-xl bg-slate-50 border border-slate-200 px-3.5 flex items-center text-xs text-slate-400 font-medium">
                            {field.placeholder || `[${field.type.replace('_', ' ')} placeholder]`}
                          </div>

                          {field.helperText && (
                            <p className="text-[11px] text-slate-500 mt-1.5 pl-1">{field.helperText}</p>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Right Sidebar: Property Inspector */}
          <aside className="w-80 border-l border-slate-200 bg-white p-5 overflow-y-auto shrink-0">
            {selectedField ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Field Properties
                    </h4>
                    <p className="text-[10px] font-mono text-indigo-600">{selectedField.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFieldId(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Field Label</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => handleUpdateField(selectedField.id, { label: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Placeholder Text</label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={(e) => handleUpdateField(selectedField.id, { placeholder: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Helper Description</label>
                  <input
                    type="text"
                    value={selectedField.helperText || ''}
                    onChange={(e) => handleUpdateField(selectedField.id, { helperText: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Field Width</label>
                  <select
                    value={selectedField.width || 'full'}
                    onChange={(e) => handleUpdateField(selectedField.id, { width: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="full">Full Width (100%)</option>
                    <option value="half">Half Width (50%)</option>
                    <option value="third">One Third (33%)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedField.validation?.required || false}
                      onChange={(e) =>
                        handleUpdateField(selectedField.id, {
                          validation: { ...selectedField.validation, required: e.target.checked },
                        })
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Mandatory / Required Field</span>
                  </label>
                </div>

                {/* Choice Options Manager */}
                {(selectedField.type === 'select' ||
                  selectedField.type === 'radio' ||
                  selectedField.type === 'multiselect') && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase">Selection Choices</label>
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
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Option
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedField.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const updated = [...(selectedField.options || [])]
                              updated[oIdx] = { ...updated[oIdx], label: e.target.value }
                              handleUpdateField(selectedField.id, { options: updated })
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900"
                            placeholder="Option Label"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedField.options?.filter((_, idx) => idx !== oIdx)
                              handleUpdateField(selectedField.id, { options: updated })
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                  <Settings className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">No Element Selected</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[180px]">
                  Click any field on the canvas to configure properties & validation.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Share & Embed Modal - Light Theme */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Share & Embed Form</h3>
                  <p className="text-xs text-slate-500">Distribute your form link to participants</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-700">Direct Public Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl)
                    setCopiedLink(true)
                    setTimeout(() => setCopiedLink(false), 2000)
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-sm transition-all shrink-0"
                >
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase text-slate-700">HTML Iframe Embed Snippet</label>
              <textarea
                readOnly
                rows={3}
                value={`<iframe src="${publicUrl}" width="100%" height="850px" frameborder="0"></iframe>`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-mono resize-none focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">Embed directly into WordPress, Wix, Squarespace, or custom web portals.</p>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal - Light Theme */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Form Templates Library</h3>
                  <p className="text-xs text-slate-500">1-click starter blueprints for MUN and enterprise applications</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
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
                  className="p-5 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 cursor-pointer transition-all space-y-2 group shadow-2xs"
                >
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {tpl.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{tpl.description}</p>
                  <div className="flex items-center gap-2 pt-2 text-[10px] text-slate-400 font-semibold">
                    <span>{tpl.sections.length} Steps</span>
                    <span>•</span>
                    <span className={tpl.paymentConfig?.enabled ? 'text-emerald-600 font-bold' : ''}>
                      {tpl.paymentConfig?.enabled ? 'Paid Registration' : 'Free Form'}
                    </span>
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

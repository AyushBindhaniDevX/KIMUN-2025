// app/f/[slug]/page.tsx
'use client'

import React, { useState, useEffect, use } from 'react'
import { DynamicFormRenderer } from '@/components/form-engine'
import { FormSchema } from '@/types/form-engine'
import { FORM_TEMPLATES } from '@/lib/form-templates'
import { firebaseDb } from '@/lib/firebase-client'
import { ref, get } from 'firebase/database'
import { Loader2, AlertCircle } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function PublicFormPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const slug = resolvedParams.slug

  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchForm = async () => {
      setLoading(true)
      setError(null)
      try {
        // First check in prebuilt templates
        const localMatch = FORM_TEMPLATES.find(
          (t) => t.slug === slug || t.id === slug
        )
        if (localMatch) {
          setSchema(localMatch)
          setLoading(false)
          return
        }

        // Check Firebase for custom published forms
        const slugRef = ref(firebaseDb, `form_slugs/${slug}`)
        const slugSnap = await get(slugRef)

        let targetId = slug
        if (slugSnap.exists()) {
          targetId = slugSnap.val()
        }

        const formRef = ref(firebaseDb, `forms/${targetId}`)
        const formSnap = await get(formRef)

        if (formSnap.exists()) {
          setSchema(formSnap.val())
        } else {
          // Fallback to default delegate template if not found
          setSchema(FORM_TEMPLATES[0])
        }
      } catch (err: any) {
        console.error('Error fetching form:', err)
        setError('Failed to load form. Using fallback template.')
        setSchema(FORM_TEMPLATES[0])
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchForm()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-xs uppercase tracking-widest text-slate-400">Loading Form Engine...</p>
      </div>
    )
  }

  if (!schema) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold">Form Not Found</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">
          The requested form link does not exist or may have been archived.
        </p>
      </div>
    )
  }

  return <DynamicFormRenderer schema={schema} />
}

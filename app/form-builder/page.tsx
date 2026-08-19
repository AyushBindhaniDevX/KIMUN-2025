// app/form-builder/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { FormBuilderStudio } from '@/components/form-engine'
import { FormSchema } from '@/types/form-engine'
import { FORM_TEMPLATES } from '@/lib/form-templates'
import { firebaseAuth, firebaseDb, googleProvider } from '@/lib/firebase-client'
import { ref, set } from 'firebase/database'
import { signInWithPopup } from 'firebase/auth'

export default function FormBuilderPage() {
  const [selectedSchema, setSelectedSchema] = useState<FormSchema>(FORM_TEMPLATES[0])

  const handleSaveForm = async (schema: FormSchema) => {
    try {
      if (!firebaseAuth.currentUser) {
        await signInWithPopup(firebaseAuth, googleProvider)
      }
      await set(ref(firebaseDb, `forms/${schema.id}`), schema)
      // Also register slug mapping
      if (schema.slug) {
        await set(ref(firebaseDb, `form_slugs/${schema.slug}`), schema.id)
      }
    } catch (err: any) {
      console.error('Failed to persist form:', err)
      alert('Save note: ' + (err.message || 'Please ensure you are signed in to save.'))
    }
  }

  return (
    <FormBuilderStudio
      initialSchema={selectedSchema}
      onSave={handleSaveForm}
      onPublish={handleSaveForm}
    />
  )
}

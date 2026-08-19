// app/form-builder/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { FormBuilderStudio } from '@/components/form-engine'
import { FormSchema } from '@/types/form-engine'
import { FORM_TEMPLATES } from '@/lib/form-templates'
import { firebaseDb } from '@/lib/firebase-client'
import { ref, set, get } from 'firebase/database'

export default function FormBuilderPage() {
  const [selectedSchema, setSelectedSchema] = useState<FormSchema>(FORM_TEMPLATES[0])

  const handleSaveForm = async (schema: FormSchema) => {
    try {
      await set(ref(firebaseDb, `forms/${schema.id}`), schema)
      // Also register slug mapping
      if (schema.slug) {
        await set(ref(firebaseDb, `form_slugs/${schema.slug}`), schema.id)
      }
    } catch (err) {
      console.error('Failed to persist form:', err)
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

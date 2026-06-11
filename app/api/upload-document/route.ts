import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as Blob
    const uid = formData.get('uid') as string
    const field = formData.get('field') as string
    const originalName = formData.get('name') as string

    if (!file || !uid || !field || !originalName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ success: false, error: 'Supabase is not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Attempt to create the bucket 'onboarding' in case it doesn't exist
    try {
      await supabase.storage.createBucket('onboarding', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })
    } catch (err) {
      // Ignore error if bucket already exists
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileExt = originalName.split('.').pop()
    const fileName = `${uid}/${field}_${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('onboarding')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true
      })

    if (error) {
      console.error('Supabase storage onboarding upload error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('onboarding')
      .getPublicUrl(fileName)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    console.error('Error in upload-document route:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

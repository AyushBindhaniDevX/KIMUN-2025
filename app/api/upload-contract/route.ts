import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as Blob
    const uid = formData.get('uid') as string

    if (!file || !uid) {
      return NextResponse.json({ success: false, error: 'Missing file or uid' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ success: false, error: 'Supabase is not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Attempt to create the bucket in case it doesn't exist
    try {
      await supabase.storage.createBucket('contracts', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })
    } catch (err) {
      // Ignore error if bucket already exists
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${uid}_signed_contract_${Date.now()}.pdf`

    const { data, error } = await supabase.storage
      .from('contracts')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('contracts')
      .getPublicUrl(fileName)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    console.error('Error in upload-contract route:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

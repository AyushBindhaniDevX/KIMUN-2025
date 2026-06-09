import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type DelegateProfile = {
  id: number
  full_name: string
  email: string | null
  phone: string | null
  institution: string | null
  city: string | null
  country: string | null
  year: number
  conference_name: string | null
  committee: string | null
  portfolio: string | null
  portfolio_preference_one: string | null
  portfolio_preference_two: string | null
  booking_code: string | null
  number_of_mun_attended: number | null
  joint_delegate_name: string | null
  joint_delegate_email: string | null
  joint_delegate_phone: string | null
  awards: string | null
  is_blacklisted: boolean | null
  ban_status: string | null
  ban_year: number | null
  ban_reason: string | null
  created_at: string | null
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 500 }
    )
  }

  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase() ?? ''
  const phone = request.nextUrl.searchParams.get('phone')?.trim() ?? ''

  if (!email && !phone) {
    return NextResponse.json(
      { error: 'Provide email or phone' },
      { status: 400 }
    )
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    let query = supabase
      .from('delegate_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (email && phone) {
      query = query.or(`email.eq.${email},phone.eq.${phone}`)
    } else if (email) {
      query = query.eq('email', email)
    } else {
      query = query.eq('phone', phone)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch legacy profile', details: error.message },
        { status: 500 }
      )
    }

    const profile = (data?.[0] ?? null) as DelegateProfile | null

    return NextResponse.json({ profile })
  } catch (err: any) {
    console.error('Unexpected API error:', err)
    return NextResponse.json(
      { error: 'Unexpected server error', details: err?.message || err },
      { status: 500 }
    )
  }
}
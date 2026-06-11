import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 500 }
    )
  }

  const queryParam = request.nextUrl.searchParams.get('query')?.trim() ?? ''

  if (!queryParam) {
    return NextResponse.json({ delegates: [] })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Search across full_name, email, phone, institution, committee, portfolio, and booking_code using ILIKE
    const ilikeQuery = `%${queryParam}%`
    
    const { data, error } = await supabase
      .from('delegate_profiles')
      .select('*')
      .or(
        `full_name.ilike.${ilikeQuery},` +
        `email.ilike.${ilikeQuery},` +
        `phone.ilike.${ilikeQuery},` +
        `institution.ilike.${ilikeQuery},` +
        `committee.ilike.${ilikeQuery},` +
        `portfolio.ilike.${ilikeQuery},` +
        `booking_code.ilike.${ilikeQuery}`
      )
      .limit(50)

    if (error) {
      console.error('Supabase search error:', error)
      return NextResponse.json(
        { error: 'Failed to query Supabase', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ delegates: data ?? [] })
  } catch (err: any) {
    console.error('Unexpected Supabase search error:', err)
    return NextResponse.json(
      { error: 'Unexpected server error', details: err?.message || err },
      { status: 500 }
    )
  }
}

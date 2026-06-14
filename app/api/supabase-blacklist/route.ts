import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { id, isBlacklisted, reason } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing delegate id' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const updateData = {
      is_blacklisted: isBlacklisted,
      ban_status: isBlacklisted ? 'Banned' : 'none',
      ban_reason: isBlacklisted ? reason : null,
      ban_year: isBlacklisted ? new Date().getFullYear().toString() : null
    }

    const { error } = await supabase
      .from('delegate_profiles')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Supabase blacklist error:', error)
      return NextResponse.json(
        { error: 'Failed to update Supabase record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Unexpected Supabase blacklist error:', err)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}

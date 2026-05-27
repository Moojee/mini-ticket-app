import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
   console.log('callback hit, code:', code) // เพิ่มบรรทัดนี้

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      console.log('exchange result:', { user: data?.user?.email, error }) // เพิ่มบรรทัดนี้


    if (!error && data.user) {
      // Upsert profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email!,
        full_name: data.user.user_metadata?.full_name ?? null,
        avatar_url: data.user.user_metadata?.avatar_url ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

      return NextResponse.redirect(`${origin}/board`) //board
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

'use server'

import { createClient } from '@/utils/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('LOGIN ATTEMPT:', { email, passwordLength: password?.length })

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('AUTH ERROR:', { message: error.message, status: error.status, code: error.code })
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  console.log('AUTH SUCCESS:', {
    userId: data.user?.id,
    email: data.user?.email,
    hasSession: !!data.session,
    sessionExpiry: data.session?.expires_at,
    accessToken: data.session?.access_token ? 'present' : 'missing',
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  console.log('POST-LOGIN USER CHECK:', {
    userFound: !!user,
    userId: user?.id,
    userError: userError?.message ?? 'none',
  })

  revalidatePath('/', 'layout')
  console.log('REDIRECTING to /onboarding...')
  redirect('/onboarding')
}
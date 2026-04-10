import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  console.log('[proxy] hit:', request.nextUrl.pathname) 
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // First set them on the request (for the current handler)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Then set them on the response (so the browser gets them)
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not write any logic between createServerClient and
  // getUser(). A seemingly innocent change could break session refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all routes under /dashboard (adjust to your needs)
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/create-bill')
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')

  if (!user && isProtectedRoute) {
    // Redirect unauthenticated users to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    // Redirect already-logged-in users away from auth pages
    const url = request.nextUrl.clone()
    url.pathname = '/create-bill'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: Return supabaseResponse (not NextResponse.next()) so
  // that refreshed session cookies are forwarded to the browser.
  return supabaseResponse
}

export const config = {
  matcher: [https://billsplit-mfhkvqzq4-wachira-glorys-projects.vercel.app/login
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
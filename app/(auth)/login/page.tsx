'use client'

import { useState, use } from 'react' // 1. Import 'use'
import { login } from '@/app/(auth)/actions'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

// 2. Update the type to a Promise
export default function LoginPage(props: { 
  searchParams: Promise<{ error?: string }> 
}) {
  // 3. Unwrap the searchParams promise
  const searchParams = use(props.searchParams)
  
  const [showPass, setShowPass] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      <form className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">SplitBill</h1>
        <p className="text-slate-500 text-center mb-8">Welcome back!</p>

        {/* 4. Now you can access .error safely */}
        {searchParams?.error && (
          <div className="p-3 mb-6 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center">
            {searchParams.error}
          </div>
        )}

        {/* ... rest of your form code ... */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1">Email Address</label>
            <input name="email" type="email" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold">Password</label>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot?</Link>
            </div>
            <input 
              name="password" 
              type={showPass ? "text" : "password"} 
              required 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-9 text-slate-400">
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button formAction={login} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all">
            Sign In
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-600">
          Don't have an account? <Link href="/signup" className="text-blue-600 font-bold hover:underline">Sign Up</Link>
        </p>
      </form>
    </div>
  )
}
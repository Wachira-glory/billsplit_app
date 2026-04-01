'use client'

import { useState, use } from 'react' // Added 'use' to unwrap promises
// import { signup } from '@/app/(auth)/actions'
import Link from 'next/link'
import { Eye, EyeOff, ShieldCheck, ShieldAlert, Mail, AlertCircle } from 'lucide-react'
import { signup } from '@/app/actions/unda'

export default function SignupPage(props: { 
  searchParams: Promise<{ message?: string, error?: string }> 
}) {
  const searchParams = use(props.searchParams) // Unwrap the promise
  
  const [showPass, setShowPass] = useState(false)
  const [password, setPassword] = useState('')
  
  const hasUpper = /[A-Z]/.test(password)
  const hasSymbol = /[!@#$%^&*]/.test(password)
  const isLongEnough = password.length >= 8

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 text-slate-900">
      <form className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
        <h1 className="text-3xl font-extrabold mb-6">Create Account</h1>

        {/* 1. SUCCESS: The "Magic Link" confirmation */}
        {searchParams?.message && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
            <Mail className="shrink-0" size={20} />
            <p><strong>Check your inbox!</strong> {searchParams.message}</p>
          </div>
        )}

        {/* 2. ERROR: Something went wrong */}
        {searchParams?.error && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 text-red-800 border border-red-200 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="shrink-0" size={20} />
            <p>{searchParams.error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Full Name</label>
            <input name="fullName" placeholder="John Doe" required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input name="email" type="email" placeholder="you@example.com" required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input 
              name="password" 
              type={showPass ? "text" : "password"} 
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-9 text-slate-400">
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          <div className="text-xs space-y-1 mt-2 p-2 bg-slate-50 rounded-lg">
            <p className={isLongEnough ? "text-green-600 flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
              {isLongEnough ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>} 8+ characters
            </p>
            <p className={hasUpper && hasSymbol ? "text-green-600 flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
              {hasUpper && hasSymbol ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>} Upper & Symbol (!@#$)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Confirm Password</label>
            <input name="confirmPassword" type="password" required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button formAction={signup} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-[0.99]">
            Create Free Account
          </button>
        </div>
        
        <p className="mt-6 text-center text-sm text-slate-600">
          Already a member? <Link href="/login" className="text-blue-600 font-bold hover:underline">Log In</Link>
        </p>
      </form>
    </div>
  )
}
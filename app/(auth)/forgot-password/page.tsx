'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Hotel, AlertCircle, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setSuccess(data.message)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-10 flex flex-col items-center">
          <Link href="/" className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary">
              <Hotel size={20} className="text-primary-foreground" />
            </div>
            <span className="font-display text-[22px] font-semibold tracking-[-1px] text-foreground">
              Eset Hotel
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">Password Reset</p>
        </div>

        <div className="rounded-[16px] border border-border bg-card p-8 shadow-sm">
          {success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle size={16} className="flex-shrink-0 text-emerald-600" />
                <span className="text-sm text-emerald-700">{success}</span>
              </div>
              <Link
                href="/login"
                className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mb-2 font-heading text-2xl font-semibold text-foreground">Forgot password?</h1>
              <p className="mb-8 text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>

              {error && (
                <div className="mb-6 flex items-center gap-3 rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3">
                  <AlertCircle size={16} className="flex-shrink-0 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@esethotel.com"
                    className="w-full rounded-[8px] border border-border bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 flex w-full items-center justify-center rounded-[8px] bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/login" className="hover:text-foreground transition-colors">← Back to Login</Link>
        </p>
      </div>
    </div>
  )
}

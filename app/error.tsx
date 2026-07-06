'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an analytics or error tracking service
    console.error('Unhandled system exception:', error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-lg space-y-6">
        {/* Animated Warning Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          <AlertTriangle size={32} className="animate-bounce" />
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred while loading this page. Our technical team has been notified.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-muted-foreground bg-muted p-1.5 rounded border border-border">
              Digest: {error.digest}
            </p>
          )}
          {error.message && (
            <p className="text-xs font-mono text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 p-3 rounded border border-red-200 dark:border-red-800/50 break-all text-left">
              {error.message}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
          
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2.5 rounded-lg text-sm font-semibold border border-border transition-all"
          >
            <Home size={15} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

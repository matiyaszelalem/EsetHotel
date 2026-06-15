'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type GSAPCallback = (
  gsapInstance: typeof gsap,
  ScrollTriggerPlugin: typeof ScrollTrigger
) => void | (() => void)

/**
 * Thin wrapper around GSAP + ScrollTrigger that:
 * 1. Registers the plugin once.
 * 2. Runs your callback inside `useEffect`.
 * 3. Cleans up ScrollTrigger instances on unmount.
 */
export function useGSAP(callback: GSAPCallback, deps: unknown[] = []) {
  const ctx = useRef<gsap.Context | null>(null)

  useEffect(() => {
    ctx.current = gsap.context(() => {
      callback(gsap, ScrollTrigger)
    })

    return () => {
      ctx.current?.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

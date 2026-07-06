'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

type GSAPCallback = (
  gsapInstance: typeof gsap,
  ScrollTriggerPlugin: typeof ScrollTrigger
) => void | (() => void)

export function useGSAP(callback: GSAPCallback, deps: unknown[] = []) {
  const ctx = useRef<gsap.Context | null>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    ctx.current = gsap.context(() => {
      callback(gsap, ScrollTrigger)
    })

    return () => {
      ctx.current?.revert()
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, deps)
}

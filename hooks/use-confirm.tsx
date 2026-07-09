'use client'

import { useState, useCallback } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  resolve: (value: boolean) => void
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback(
    (message: string, options?: {
      title?: string
      confirmLabel?: string
      cancelLabel?: string
      variant?: 'default' | 'destructive'
    }) => {
      return new Promise<boolean>((resolve) => {
        setState({
          open: true,
          title: options?.title || 'Confirm',
          message,
          confirmLabel: options?.confirmLabel,
          cancelLabel: options?.cancelLabel,
          variant: options?.variant,
          resolve,
        })
      })
    },
    []
  )

  const handleConfirm = () => {
    state?.resolve(true)
    setState(null)
  }

  const handleCancel = () => {
    state?.resolve(false)
    setState(null)
  }

  const dialog = state ? (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null

  return { confirm, dialog }
}

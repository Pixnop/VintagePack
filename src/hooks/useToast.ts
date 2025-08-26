import { useState, useCallback } from 'react'
import { Toast, ToastType } from '../components/ui/Toast'

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    options?: {
      duration?: number
      action?: {
        label: string
        onClick: () => void
      }
    }
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: Toast = {
      id,
      type,
      title,
      message,
      duration: options?.duration,
      action: options?.action
    }

    setToasts(prev => [...prev, toast])
    return id
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
  const success = useCallback((title: string, message?: string, options?: { action?: { label: string, onClick: () => void } }) => 
    addToast('success', title, message, options), [addToast])
  
  const error = useCallback((title: string, message?: string, options?: { action?: { label: string, onClick: () => void } }) => 
    addToast('error', title, message, options), [addToast])
  
  const warning = useCallback((title: string, message?: string, options?: { action?: { label: string, onClick: () => void } }) => 
    addToast('warning', title, message, options), [addToast])
  
  const info = useCallback((title: string, message?: string, options?: { action?: { label: string, onClick: () => void } }) => 
    addToast('info', title, message, options), [addToast])

  return {
    toasts,
    addToast,
    dismissToast,
    dismissAll,
    success,
    error,
    warning,
    info
  }
}
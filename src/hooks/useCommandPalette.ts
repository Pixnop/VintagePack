import { useState, useEffect } from 'react'

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(prev => !prev)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
    }

    // Custom event listener for navigation
    const handleNavigateToView = (e: CustomEvent) => {
      const view = e.detail
      // Find the view toggle buttons and click the appropriate one
      const viewButtons = document.querySelectorAll('[data-view]')
      viewButtons.forEach(button => {
        if (button.getAttribute('data-view') === view) {
          (button as HTMLButtonElement).click()
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('navigate-to-view', handleNavigateToView as EventListener)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('navigate-to-view', handleNavigateToView as EventListener)
    }
  }, [])

  return {
    isOpen,
    open,
    close,
    toggle
  }
}
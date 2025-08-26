import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps extends Toast {
  onDismiss: (id: string) => void
}

const toastConfig = {
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    textColor: 'text-green-600',
    iconColor: 'text-green-500'
  },
  error: {
    icon: XCircleIcon,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    textColor: 'text-red-600',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    textColor: 'text-yellow-600',
    iconColor: 'text-yellow-500'
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    textColor: 'text-blue-600',
    iconColor: 'text-blue-500'
  }
}

const ToastItemComponent = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ id, type, title, message, action, onDismiss }, ref) => {
    const config = toastConfig[type]
    const IconComponent = config.icon

    React.useEffect(() => {
      // Auto-dismiss after duration (default 5 seconds)
      const duration = type === 'error' ? 8000 : 5000
      const timer = setTimeout(() => {
        onDismiss(id)
      }, duration)

      return () => clearTimeout(timer)
    }, [id, type, onDismiss])

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.95 }}
        transition={{ 
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        className={`glass rounded-2xl border p-4 min-w-80 max-w-md shadow-lg ${config.bgColor} ${config.borderColor}`}
        whileHover={{ scale: 1.02, y: -2 }}
      >
      <div className="flex items-start space-x-3">
        <motion.div
          className={`flex-shrink-0 ${config.iconColor}`}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <IconComponent className="w-6 h-6" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`font-semibold text-sm ${config.textColor}`}>
                {title}
              </h4>
              {message && (
                <p className="mt-1 text-sm text-secondary line-clamp-2">
                  {message}
                </p>
              )}
            </div>

            <motion.button
              onClick={() => onDismiss(id)}
              className="ml-4 text-tertiary hover:text-secondary transition-colors p-1 rounded-lg hover:bg-white/5"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <XMarkIcon className="w-4 h-4" />
            </motion.button>
          </div>

          {action && (
            <motion.div
              className="mt-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.2 }}
            >
              <motion.button
                onClick={() => {
                  action.onClick()
                  onDismiss(id)
                }}
                className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${config.textColor} hover:bg-white/10`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {action.label}
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-b-2xl"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ 
          duration: type === 'error' ? 8 : 5,
          ease: 'linear'
        }}
      />
    </motion.div>
  )
  }
)

ToastItemComponent.displayName = 'ToastItem'

export function ToastItem(props: ToastProps) {
  return <ToastItemComponent {...props} />
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-20 right-6 z-50 space-y-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItemComponent
            key={toast.id}
            {...toast}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface FloatingAction {
  id: string
  icon: React.ReactNode
  label: string
  action: () => void
  color?: string
}

interface FloatingActionButtonProps {
  actions: FloatingAction[]
  isOpen: boolean
  onToggle: () => void
  mainIcon?: React.ReactNode
  className?: string
}

export default function FloatingActionButton({
  actions,
  isOpen,
  onToggle,
  mainIcon = <PlusIcon className="w-6 h-6" />,
  className = "fixed bottom-8 right-8"
}: FloatingActionButtonProps) {
  return (
    <div className={`z-40 ${className}`}>
      {/* Action Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-16 right-0 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                className="flex items-center space-x-3"
                initial={{ 
                  opacity: 0, 
                  x: 20, 
                  y: 20,
                  scale: 0.8
                }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  y: 0,
                  scale: 1
                }}
                exit={{ 
                  opacity: 0, 
                  x: 20, 
                  y: 20,
                  scale: 0.8
                }}
                transition={{ 
                  delay: index * 0.05,
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                {/* Label */}
                <motion.div
                  className="glass-secondary rounded-xl px-3 py-2 text-sm font-medium text-primary whitespace-nowrap"
                  whileHover={{ scale: 1.05, x: -2 }}
                  transition={{ duration: 0.1 }}
                >
                  {action.label}
                </motion.div>
                
                {/* Action Button */}
                <motion.button
                  onClick={() => {
                    action.action()
                    onToggle()
                  }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center floating transition-all ${
                    action.color || 'bg-amber-500 hover:bg-amber-600'
                  } text-white shadow-lg`}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: 5
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {action.icon}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={onToggle}
        className="w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center floating shadow-2xl relative overflow-hidden"
        whileHover={{ 
          scale: 1.1,
          rotate: isOpen ? 0 : 5
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        aria-label={isOpen ? "Fermer les actions" : "Ouvrir les actions"}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {isOpen ? <XMarkIcon className="w-6 h-6" /> : mainIcon}
        </motion.div>
        
        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          whileTap={{
            background: [
              "radial-gradient(circle, transparent 0%, transparent 100%)",
              "radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 60%)",
              "radial-gradient(circle, transparent 0%, transparent 100%)"
            ]
          }}
          transition={{ duration: 0.6 }}
        />
      </motion.button>
    </div>
  )
}
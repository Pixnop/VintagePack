import { motion } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme, resolvedTheme } = useTheme()

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />
      case 'dark':
        return <Moon className="w-5 h-5" />
      case 'system':
        return <Monitor className="w-5 h-5" />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Mode clair'
      case 'dark':
        return 'Mode sombre'
      case 'system':
        return 'Système'
    }
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="glass-secondary rounded-xl p-3 group relative overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={getLabel()}
    >
      <motion.div
        className="relative z-10"
        initial={false}
        animate={{ 
          rotate: theme === 'dark' ? 180 : 0,
          scale: theme === 'system' ? 1.1 : 1
        }}
        transition={{ 
          duration: 0.3, 
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        {getIcon()}
      </motion.div>
      
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{
          background: resolvedTheme === 'dark' 
            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)'
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Ripple effect on click */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        whileTap={{
          background: [
            'radial-gradient(circle, transparent 0%, transparent 100%)',
            'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
            'radial-gradient(circle, transparent 0%, transparent 100%)'
          ]
        }}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  )
}
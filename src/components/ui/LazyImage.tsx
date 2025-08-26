import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  fallback?: string
  placeholder?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
}

export default function LazyImage({
  src,
  alt,
  className = '',
  fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZmFmYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIj5JbWFnZTwvdGV4dD48L3N2Zz4=',
  placeholder,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !isInView) {
          setIsInView(true)
          setIsLoading(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px 0px' // Start loading 50px before image is visible
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [isInView])

  const handleLoad = () => {
    setIsLoaded(true)
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    onError?.()
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        {!isInView ? (
          // Placeholder before image is in view
          <motion.div
            key="placeholder"
            className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {placeholder || (
              <div className="flex flex-col items-center space-y-2 text-gray-400">
                <div className="w-8 h-8 bg-gray-300 rounded animate-pulse" />
                <div className="text-xs">Chargement...</div>
              </div>
            )}
          </motion.div>
        ) : !isLoaded && !hasError ? (
          // Loading state
          <motion.div
            key="loading"
            className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        ) : hasError ? (
          // Error state
          <motion.div
            key="error"
            className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.img
              src={fallback}
              alt="Erreur de chargement"
              className="w-full h-full object-cover opacity-50"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ) : (
          // Loaded image
          <motion.img
            key="image"
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onLoad={handleLoad}
            onError={handleError}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1]
            }}
          />
        )}
      </AnimatePresence>

      {/* Shimmer effect during loading */}
      {isLoading && !isLoaded && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </div>
  )
}
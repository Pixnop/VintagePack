import React from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline'

interface PaginationProps {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  totalItems: number
  pageRange: { start: number; end: number }
  onNextPage: () => void
  onPrevPage: () => void
  onGoToPage: (page: number) => void
  pageSize: number
  onChangePageSize: (size: number) => void
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  totalItems,
  pageRange,
  onNextPage,
  onPrevPage,
  onGoToPage,
  pageSize,
  onChangePageSize,
  className = ''
}: PaginationProps) {
  // Generate visible page numbers (max 7 pages shown)
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    
    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i)
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }
    
    rangeWithDots.push(...range)
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }
    
    // Remove duplicates and invalid entries
    return rangeWithDots.filter((item, index, arr) => 
      item !== arr[index - 1] && (typeof item === 'number' ? item <= totalPages : true)
    )
  }

  const visiblePages = getVisiblePages()

  if (totalPages <= 1) return null

  return (
    <motion.div
      className={`flex items-center justify-between glass-secondary rounded-2xl p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Info et sélecteur de taille */}
      <div className="flex items-center space-x-4">
        <div className="text-sm text-secondary">
          <span className="font-semibold text-primary">{pageRange.start}-{pageRange.end}</span> sur{' '}
          <span className="font-semibold text-primary">{totalItems}</span>
        </div>
        
        <select
          value={pageSize}
          onChange={(e) => onChangePageSize(Number(e.target.value))}
          className="input-glass text-sm py-1 px-2 min-w-0"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Contrôles de pagination */}
      <div className="flex items-center space-x-2">
        {/* First page */}
        <motion.button
          onClick={() => onGoToPage(1)}
          disabled={!hasPrevPage}
          className="p-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-secondary hover:text-primary hover:bg-amber-100/20"
          whileHover={hasPrevPage ? { scale: 1.05 } : {}}
          whileTap={hasPrevPage ? { scale: 0.95 } : {}}
        >
          <ChevronDoubleLeftIcon className="w-4 h-4" />
        </motion.button>

        {/* Previous page */}
        <motion.button
          onClick={onPrevPage}
          disabled={!hasPrevPage}
          className="p-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-secondary hover:text-primary hover:bg-amber-100/20"
          whileHover={hasPrevPage ? { scale: 1.05 } : {}}
          whileTap={hasPrevPage ? { scale: 0.95 } : {}}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </motion.button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => (
            <motion.div key={`${page}-${index}`}>
              {page === '...' ? (
                <span className="px-2 py-1 text-secondary">…</span>
              ) : (
                <motion.button
                  onClick={() => onGoToPage(page as number)}
                  className={`px-3 py-1 text-sm font-medium rounded-xl transition-all relative ${
                    page === currentPage
                      ? 'text-white shadow-lg'
                      : 'text-secondary hover:text-primary hover:bg-amber-100/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {page === currentPage && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'var(--gradient-brand)' }}
                      layoutId="activePage"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <span className="relative z-10">{page}</span>
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Next page */}
        <motion.button
          onClick={onNextPage}
          disabled={!hasNextPage}
          className="p-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-secondary hover:text-primary hover:bg-amber-100/20"
          whileHover={hasNextPage ? { scale: 1.05 } : {}}
          whileTap={hasNextPage ? { scale: 0.95 } : {}}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </motion.button>

        {/* Last page */}
        <motion.button
          onClick={() => onGoToPage(totalPages)}
          disabled={!hasNextPage}
          className="p-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-secondary hover:text-primary hover:bg-amber-100/20"
          whileHover={hasNextPage ? { scale: 1.05 } : {}}
          whileTap={hasNextPage ? { scale: 0.95 } : {}}
        >
          <ChevronDoubleRightIcon className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}
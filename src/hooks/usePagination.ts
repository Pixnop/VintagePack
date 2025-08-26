import { useState, useMemo } from 'react'

interface PaginationOptions {
  initialPage?: number
  initialPageSize?: number
}

export function usePagination<T>(
  data: T[],
  options: PaginationOptions = {}
) {
  const { initialPage = 1, initialPageSize = 20 } = options
  
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, pageSize])
  
  const totalPages = Math.ceil(data.length / pageSize)
  const totalItems = data.length
  
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1
  
  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }
  
  const prevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }
  
  const goToPage = (page: number) => {
    const clampedPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(clampedPage)
  }
  
  const changePageSize = (size: number) => {
    const newTotalPages = Math.ceil(data.length / size)
    const newCurrentPage = Math.min(currentPage, newTotalPages)
    setPageSize(size)
    setCurrentPage(newCurrentPage)
  }
  
  const reset = () => {
    setCurrentPage(initialPage)
    setPageSize(initialPageSize)
  }
  
  return {
    currentPage,
    pageSize,
    paginatedData,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    changePageSize,
    reset,
    // Helper for page range display
    pageRange: {
      start: Math.min((currentPage - 1) * pageSize + 1, totalItems),
      end: Math.min(currentPage * pageSize, totalItems)
    }
  }
}
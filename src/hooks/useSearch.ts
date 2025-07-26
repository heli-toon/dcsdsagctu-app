import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { FileItem } from '../lib/types'

export interface SearchResult extends FileItem {
  relevanceScore: number
  matchedFields: string[]
}

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [allContent, setAllContent] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Fetch all content on mount
  useEffect(() => {
    fetchAllContent()
    loadSearchHistory()
  }, [])

  const fetchAllContent = async () => {
    setLoading(true)
    try {
      const collections = ['slides', 'assignments', 'links', 'announcements']
      const allItems: FileItem[] = []

      for (const collectionName of collections) {
        const q = query(collection(db, collectionName), orderBy('date', 'desc'))
        const querySnapshot = await getDocs(q)
        querySnapshot.forEach((doc) => {
          allItems.push({ 
            id: doc.id, 
            ...doc.data(),
            type: collectionName 
          } as FileItem)
        })
      }

      setAllContent(allItems)
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSearchHistory = () => {
    const history = localStorage.getItem('dcsdsagctu-search-history')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }

  const saveSearchHistory = (query: string) => {
    if (query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory.slice(0, 9)] // Keep last 10 searches
      setSearchHistory(newHistory)
      localStorage.setItem('dcsdsagctu-search-history', JSON.stringify(newHistory))
    }
  }

  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('dcsdsagctu-search-history')
  }

  // Calculate relevance score based on multiple factors
  const calculateRelevance = (item: FileItem, query: string): { score: number; matchedFields: string[] } => {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
    let score = 0
    const matchedFields: string[] = []

    searchTerms.forEach(term => {
      // Title/Name match (highest priority)
      const title = (item.name || item.title || '').toLowerCase()
      if (title.includes(term)) {
        score += title.startsWith(term) ? 10 : 5
        if (!matchedFields.includes('title')) matchedFields.push('title')
      }

      // Content match
      if (item.content && item.content.toLowerCase().includes(term)) {
        score += 3
        if (!matchedFields.includes('content')) matchedFields.push('content')
      }

      // Uploader match
      if (item.uploadedBy.toLowerCase().includes(term)) {
        score += 2
        if (!matchedFields.includes('uploader')) matchedFields.push('uploader')
      }

      // Type match
      if (item.type.toLowerCase().includes(term)) {
        score += 1
        if (!matchedFields.includes('type')) matchedFields.push('type')
      }

      // File name match
      if (item.fileName && item.fileName.toLowerCase().includes(term)) {
        score += 4
        if (!matchedFields.includes('fileName')) matchedFields.push('fileName')
      }

      // URL match (for links)
      if (item.url && item.url.toLowerCase().includes(term)) {
        score += 2
        if (!matchedFields.includes('url')) matchedFields.push('url')
      }
    })

    // Boost recent content
    const daysSinceUpload = (Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpload < 7) score += 1
    if (daysSinceUpload < 1) score += 2

    return { score, matchedFields }
  }

  // Search results with relevance scoring
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return []

    const results: SearchResult[] = []

    allContent.forEach(item => {
      const { score, matchedFields } = calculateRelevance(item, searchQuery)
      
      if (score > 0) {
        results.push({
          ...item,
          relevanceScore: score,
          matchedFields
        })
      }
    })

    // Sort by relevance score (descending)
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }, [searchQuery, allContent])

  // Filter results by type
  const getResultsByType = (type: string) => {
    return searchResults.filter(result => result.type === type)
  }

  // Get search suggestions based on content
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return []

    const suggestions = new Set<string>()
    const query = searchQuery.toLowerCase()

    allContent.forEach(item => {
      // Add title/name suggestions
      const title = (item.name || item.title || '').toLowerCase()
      if (title.includes(query) && title !== query) {
        suggestions.add(item.name || item.title || '')
      }

      // Add uploader suggestions
      if (item.uploadedBy.toLowerCase().includes(query)) {
        suggestions.add(item.uploadedBy)
      }

      // Add type suggestions
      if (item.type.toLowerCase().includes(query)) {
        suggestions.add(item.type)
      }
    })

    return Array.from(suggestions).slice(0, 5)
  }, [searchQuery, allContent])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      saveSearchHistory(query)
    }
  }

  return {
    searchQuery,
    setSearchQuery: handleSearch,
    searchResults,
    getResultsByType,
    searchSuggestions,
    searchHistory,
    clearSearchHistory,
    loading,
    allContent
  }
}
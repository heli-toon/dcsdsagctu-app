import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
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

  useEffect(() => {
    fetchAllContent()
    loadSearchHistory()
  }, [])

  const fetchAllContent = async () => {
    setLoading(true)
    try {
      const collections = ['slides', 'assignments', 'links', 'announcements']
      let allItems: FileItem[] = []
      for (const collectionName of collections) {
        const { data, error } = await supabase
          .from(collectionName)
          .select('*')
          .order('date', { ascending: false })
        if (error) throw error
        allItems = allItems.concat(
          (data || []).map((item: any) => ({ ...item, type: collectionName }))
        )
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
      const newHistory = [query, ...searchHistory.slice(0, 9)]
      setSearchHistory(newHistory)
      localStorage.setItem('dcsdsagctu-search-history', JSON.stringify(newHistory))
    }
  }

  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('dcsdsagctu-search-history')
  }

  const calculateRelevance = (item: FileItem, query: string): { score: number; matchedFields: string[] } => {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
    let score = 0
    const matchedFields: string[] = []

    searchTerms.forEach(term => {
      const title = (item.name || item.title || '').toLowerCase()
      if (title.includes(term)) {
        score += title.startsWith(term) ? 10 : 5
        if (!matchedFields.includes('title')) matchedFields.push('title')
      }
      if (item.content && item.content.toLowerCase().includes(term)) {
        score += 3
        if (!matchedFields.includes('content')) matchedFields.push('content')
      }
      if (item.uploadedby?.toLowerCase().includes(term)) {
        score += 2
        if (!matchedFields.includes('uploader')) matchedFields.push('uploader')
      }
      if (item.type?.toLowerCase().includes(term)) {
        score += 1
        if (!matchedFields.includes('type')) matchedFields.push('type')
      }
      if (item.filename && item.filename.toLowerCase().includes(term)) {
        score += 4
        if (!matchedFields.includes('filename')) matchedFields.push('filename')
      }
      if (item.url && item.url.toLowerCase().includes(term)) {
        score += 2
        if (!matchedFields.includes('url')) matchedFields.push('url')
      }
    })

    const daysSinceUpload = (Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpload < 7) score += 1
    if (daysSinceUpload < 1) score += 2

    return { score, matchedFields }
  }

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

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }, [searchQuery, allContent])

  const getResultsByType = (type: string) => {
    return searchResults.filter(result => result.type === type)
  }

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return []

    const suggestions = new Set<string>()
    const query = searchQuery.toLowerCase()

    allContent.forEach(item => {
      const title = (item.name || item.title || '').toLowerCase()
      if (title.includes(query) && title !== query) {
        suggestions.add(item.name || item.title || '')
      }
      if (item.uploadedby.toLowerCase().includes(query)) {
        suggestions.add(item.uploadedby)
      }
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
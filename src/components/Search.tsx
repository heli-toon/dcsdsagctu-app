import React, { useState, useRef, useEffect } from 'react'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { useSearch } from '../hooks/useSearch'
import type { SearchResult } from '../hooks/useSearch'
import { formatDate } from '../lib/utils'
import { cn } from '../lib/utils'

interface SearchProps {
  onResultClick?: (result: SearchResult) => void
  className?: string
}

export const Search: React.FC<SearchProps> = ({ onResultClick, className }) => {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchSuggestions,
    searchHistory,
    clearSearchHistory,
    loading
  } = useSearch()

  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    const totalItems = searchResults.length + searchSuggestions.length + searchHistory.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (selectedIndex < searchResults.length) {
            const result = searchResults[selectedIndex]
            onResultClick?.(result)
            setIsOpen(false)
          } else if (selectedIndex < searchResults.length + searchSuggestions.length) {
            const suggestionIndex = selectedIndex - searchResults.length
            setSearchQuery(searchSuggestions[suggestionIndex])
          } else {
            const historyIndex = selectedIndex - searchResults.length - searchSuggestions.length
            setSearchQuery(searchHistory[historyIndex])
          }
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
    let highlightedText = text

    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark class="bg-purple-500/30 text-purple-200">$1</mark>')
    })

    return highlightedText
  }

  const getMatchedFieldsText = (matchedFields: string[]) => {
    const fieldNames: { [key: string]: string } = {
      title: 'Title',
      content: 'Content',
      uploader: 'Uploader',
      type: 'Type',
      fileName: 'File Name',
      url: 'URL'
    }

    return matchedFields.map(field => fieldNames[field] || field).join(', ')
  }

  const getFileEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return "📄"
      case "pptx":
      case "ppt":
        return "📊"
      case "docx":
      case "doc":
        return "📝"
      case "link":
        return "🔗"
      case "assignment":
        return "📋"
      case "announcement":
        return "📢"
      default:
        return "📁"
    }
  }

  return (
    <div ref={searchRef} className={cn('relative w-full', className)}>
      <div className="relative w-full">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search slides, assignments, links, announcements..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400 pl-10 pr-10"
        />
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400">🔍</span>
        {searchQuery && (
          <Button
            onClick={() => {
              setSearchQuery('')
              setIsOpen(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-white"
          >
            ❌
          </Button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-black/95 border-purple-800/30 backdrop-blur-sm z-50 max-h-96 overflow-y-auto w-full">
          <CardContent className="p-0">
            {loading && (
              <div className="p-4 text-center text-purple-300">
                <span className="mr-2">⏳</span>
                Searching...
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <div className="px-4 py-2 border-b border-purple-800/30">
                  <h4 className="text-purple-300 text-sm font-medium flex items-center gap-2">
                    <span>🔍</span>
                    Search Results ({searchResults.length})
                  </h4>
                </div>
                {searchResults.slice(0, 8).map((result, index) => (
                  <div
                    key={result.id}
                    className={cn(
                      'p-4 hover:bg-purple-500/10 cursor-pointer border-b border-purple-800/20 last:border-b-0',
                      selectedIndex === index && 'bg-purple-500/20'
                    )}
                    onClick={() => {
                      onResultClick?.(result)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0">{getFileEmoji(result.type)}</span>
                      <div className="flex-1 min-w-0">
                        <h5 
                          className="text-white font-medium break-words"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(result.name || result.title || 'Untitled', searchQuery)
                          }}
                        />
                        {result.content && (
                          <p 
                            className="text-purple-200 text-sm mt-1 line-clamp-2 break-words"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(result.content.substring(0, 100) + '...', searchQuery)
                            }}
                          />
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-purple-400">
                          <span className="flex items-center gap-1">
                            <span>👤</span>
                            {result.uploadedby}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>📅</span>
                            {formatDate(result.date)}
                          </span>
                          <Badge variant="outline" className="border-purple-500/50 text-purple-300 text-xs">
                            {result.type}
                          </Badge>
                        </div>
                        {result.matchedFields.length > 0 && (
                          <div className="mt-1">
                            <span className="text-xs text-purple-500">
                              ✨ Matched: {getMatchedFieldsText(result.matchedFields)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-purple-500 bg-purple-500/20 px-2 py-1 rounded shrink-0">
                        {result.relevanceScore}
                      </div>
                    </div>
                  </div>
                ))}
                {searchResults.length > 8 && (
                  <div className="p-3 text-center text-purple-400 text-sm">
                    +{searchResults.length - 8} more results 📊
                  </div>
                )}
              </div>
            )}

            {/* Search Suggestions */}
            {searchSuggestions.length > 0 && (
              <div>
                <div className="px-4 py-2 border-b border-purple-800/30">
                  <h4 className="text-purple-300 text-sm font-medium flex items-center gap-2">
                    <span>💡</span>
                    Suggestions
                  </h4>
                </div>
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion}
                    className={cn(
                      'p-3 hover:bg-purple-500/10 cursor-pointer border-b border-purple-800/20 last:border-b-0',
                      selectedIndex === searchResults.length + index && 'bg-purple-500/20'
                    )}
                    onClick={() => {
                      setSearchQuery(suggestion)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span>↗️</span>
                      <span className="text-white">{suggestion}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && !searchQuery && (
              <div>
                <div className="px-4 py-2 border-b border-purple-800/30 flex items-center justify-between">
                  <h4 className="text-purple-300 text-sm font-medium flex items-center gap-2">
                    <span>🕒</span>
                    Recent Searches
                  </h4>
                  <button
                    onClick={clearSearchHistory}
                    className="text-purple-400 hover:text-white text-xs"
                  >
                    🗑️ Clear
                  </button>
                </div>
                {searchHistory.slice(0, 5).map((historyItem, index) => (
                  <div
                    key={historyItem}
                    className={cn(
                      'p-3 hover:bg-purple-500/10 cursor-pointer border-b border-purple-800/20 last:border-b-0',
                      selectedIndex === searchResults.length + searchSuggestions.length + index && 'bg-purple-500/20'
                    )}
                    onClick={() => {
                      setSearchQuery(historyItem)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span>🕒</span>
                      <span className="text-white">{historyItem}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {searchQuery && searchResults.length === 0 && !loading && (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h4 className="text-white text-lg mb-2">No results found</h4>
                <p className="text-purple-300 text-sm">
                  Try different keywords or check your spelling 🤔
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
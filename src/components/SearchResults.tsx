import React from 'react'
import { Card, CardContent } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { SearchResult } from '../hooks/useSearch'
import { formatDate, getFileIcon } from '../lib/utils'

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  onBack: () => void
  onResultClick?: (result: SearchResult) => void
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  onBack,
  onResultClick
}) => {
  const groupedResults = {
    slides: results.filter(r => r.type === 'slides'),
    assignments: results.filter(r => r.type === 'assignments'),
    links: results.filter(r => r.type === 'links'),
    announcements: results.filter(r => r.type === 'announcements')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-purple-300 hover:text-white"
              >
                <i className="bi-arrow-left mr-2"></i>
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Search Results</h1>
                <p className="text-purple-300 text-sm">
                  {results.length} results for "{query}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {results.length > 0 ? (
          <div className="space-y-8">
            {/* Results by Type */}
            {Object.entries(groupedResults).map(([type, typeResults]) => {
              if (typeResults.length === 0) return null

              return (
                <div key={type}>
                  <h2 className="text-xl font-bold text-white mb-4 capitalize flex items-center">
                    <i className={`${getFileIcon(type)} mr-2`}></i>
                    {type} ({typeResults.length})
                  </h2>
                  <div className="grid gap-4">
                    {typeResults.map((result) => (
                      <Card
                        key={result.id}
                        className="bg-black/40 border-purple-800/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer"
                        onClick={() => onResultClick?.(result)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <i className={`text-3xl ${getFileIcon(result.type)} text-purple-400`}></i>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h3 
                                  className="text-white font-semibold text-lg"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(result.name || result.title || 'Untitled', query)
                                  }}
                                />
                                <div className="flex items-center space-x-2 ml-4">
                                  <Badge variant="outline" className="border-purple-500 text-purple-300">
                                    {result.type}
                                  </Badge>
                                  <div className="text-xs text-purple-500 bg-purple-500/20 px-2 py-1 rounded">
                                    {result.relevanceScore}
                                  </div>
                                </div>
                              </div>
                              
                              {result.content && (
                                <p 
                                  className="text-purple-200 mb-3"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(result.content, query)
                                  }}
                                />
                              )}

                              {result.url && (
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 underline flex items-center space-x-1 mb-3"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <i className="bi-box-arrow-up-right"></i>
                                  <span>{result.url}</span>
                                </a>
                              )}

                              {result.fileUrl && (
                                <a
                                  href={result.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 underline flex items-center space-x-1 mb-3"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <i className="bi-download"></i>
                                  <span>Download</span>
                                </a>
                              )}

                              <div className="flex items-center space-x-4 text-sm text-purple-400">
                                <span className="flex items-center space-x-1">
                                  <i className="bi-person"></i>
                                  <span>{result.uploadedBy}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <i className="bi-calendar"></i>
                                  <span>{formatDate(result.date)}</span>
                                </span>
                                {result.dueDate && (
                                  <Badge variant="destructive" className="bg-red-500/20 text-red-300">
                                    Due: {formatDate(result.dueDate)}
                                  </Badge>
                                )}
                              </div>

                              {result.matchedFields.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs text-purple-500">
                                    Matched in: {result.matchedFields.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <i className="bi-search text-6xl text-purple-400 mb-4"></i>
            <h3 className="text-white text-2xl mb-2">No results found</h3>
            <p className="text-purple-300 text-lg">
              Try different keywords or check your spelling
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
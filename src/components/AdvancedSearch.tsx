import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Badge } from './ui/Badge'
import { useSearch, type SearchResult } from '../hooks/useSearch'
import { formatDate, getFileIcon } from '../lib/utils'
import { cn } from '../lib/utils'

interface AdvancedSearchProps {
  isOpen: boolean
  onClose: () => void
  onResultClick?: (result: SearchResult) => void
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  isOpen,
  onClose,
  onResultClick
}) => {
  const { searchQuery, setSearchQuery, searchResults, getResultsByType } = useSearch()
  const [filters, setFilters] = useState({
    type: 'all',
    uploader: '',
    dateFrom: '',
    dateTo: ''
  })
  const [activeTab, setActiveTab] = useState('all')

  if (!isOpen) return null

  const filteredResults = searchResults.filter(result => {
    if (filters.type !== 'all' && result.type !== filters.type) return false
    if (filters.uploader && !result.uploadedby.toLowerCase().includes(filters.uploader.toLowerCase())) return false
    if (filters.dateFrom && new Date(result.date) < new Date(filters.dateFrom)) return false
    if (filters.dateTo && new Date(result.date) > new Date(filters.dateTo)) return false
    return true
  })

  const resultsByType = {
    all: filteredResults,
    slides: getResultsByType('slides').filter(result => 
      (!filters.uploader || result.uploadedby.toLowerCase().includes(filters.uploader.toLowerCase())) &&
      (!filters.dateFrom || new Date(result.date) >= new Date(filters.dateFrom)) &&
      (!filters.dateTo || new Date(result.date) <= new Date(filters.dateTo))
    ),
    assignments: getResultsByType('assignments').filter(result => 
      (!filters.uploader || result.uploadedby.toLowerCase().includes(filters.uploader.toLowerCase())) &&
      (!filters.dateFrom || new Date(result.date) >= new Date(filters.dateFrom)) &&
      (!filters.dateTo || new Date(result.date) <= new Date(filters.dateTo))
    ),
    links: getResultsByType('links').filter(result => 
      (!filters.uploader || result.uploadedby.toLowerCase().includes(filters.uploader.toLowerCase())) &&
      (!filters.dateFrom || new Date(result.date) >= new Date(filters.dateFrom)) &&
      (!filters.dateTo || new Date(result.date) <= new Date(filters.dateTo))
    ),
    announcements: getResultsByType('announcements').filter(result => 
      (!filters.uploader || result.uploadedby.toLowerCase().includes(filters.uploader.toLowerCase())) &&
      (!filters.dateFrom || new Date(result.date) >= new Date(filters.dateFrom)) &&
      (!filters.dateTo || new Date(result.date) <= new Date(filters.dateTo))
    )
  }

  const currentResults = resultsByType[activeTab as keyof typeof resultsByType]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] bg-black/95 border-purple-800/30 overflow-hidden">
        <CardHeader className="border-b border-purple-800/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center space-x-2">
              <i className="bi-search"></i>
              <span>Advanced Search</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-purple-300 hover:text-white"
            >
              <i className="bi-x text-xl"></i>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search Input */}
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Search across all content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400 text-lg h-12"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-purple-300 text-sm mb-2 block">Content Type</label>
              <select
                title='Filter by content type'
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full bg-black/60 border border-purple-800/30 rounded-md px-3 py-2 text-white"
              >
                <option value="all">All Types</option>
                <option value="slides">Slides</option>
                <option value="assignments">Assignments</option>
                <option value="links">Links</option>
                <option value="announcements">Announcements</option>
              </select>
            </div>

            <div>
              <label className="text-purple-300 text-sm mb-2 block">Uploader</label>
              <Input
                type="text"
                placeholder="Filter by uploader"
                value={filters.uploader}
                onChange={(e) => setFilters({ ...filters, uploader: e.target.value })}
                className="bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
              />
            </div>

            <div>
              <label className="text-purple-300 text-sm mb-2 block">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="bg-black/60 border-purple-800/30 text-white"
              />
            </div>

            <div>
              <label className="text-purple-300 text-sm mb-2 block">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="bg-black/60 border-purple-800/30 text-white"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-black/40 p-1 rounded-lg">
            {[
              { key: 'all', label: 'All', count: resultsByType.all.length },
              { key: 'slides', label: 'Slides', count: resultsByType.slides.length },
              { key: 'assignments', label: 'Assignments', count: resultsByType.assignments.length },
              { key: 'links', label: 'Links', count: resultsByType.links.length },
              { key: 'announcements', label: 'Announcements', count: resultsByType.announcements.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-purple-500/20 text-white'
                    : 'text-purple-300 hover:text-white hover:bg-purple-500/10'
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {currentResults.length > 0 ? (
              currentResults.map((result) => (
                <Card
                  key={result.id}
                  className="bg-black/40 border-purple-800/30 hover:border-purple-500/50 transition-all cursor-pointer"
                  onClick={() => {
                    onResultClick?.(result)
                    onClose()
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <i className={`text-2xl ${getFileIcon(result.type)} text-purple-400`}></i>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-semibold text-lg truncate">
                            {result.name || result.title}
                          </h4>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge variant="outline" className="border-purple-500 text-purple-300">
                              {result.type}
                            </Badge>
                            <div className="text-xs text-purple-500 bg-purple-500/20 px-2 py-1 rounded">
                              Score: {result.relevanceScore}
                            </div>
                          </div>
                        </div>
                        
                        {result.content && (
                          <p className="text-purple-200 text-sm mb-3 line-clamp-2">
                            {result.content}
                          </p>
                        )}

                        {result.url && (
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 underline text-sm flex items-center space-x-1 mb-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <i className="bi-box-arrow-up-right"></i>
                            <span>{result.url}</span>
                          </a>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-purple-400">
                          <span className="flex items-center space-x-1">
                            <i className="bi-person"></i>
                            <span>{result.uploadedby}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <i className="bi-calendar"></i>
                            <span>{formatDate(result.date)}</span>
                          </span>
                          {result.duedate && (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-300">
                              Due: {formatDate(result.duedate)}
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
              ))
            ) : (
              <div className="text-center py-12">
                <i className="bi-search text-4xl text-purple-400 mb-3"></i>
                <h4 className="text-white text-lg mb-2">No results found</h4>
                <p className="text-purple-300">
                  {searchQuery ? 'Try different keywords or adjust your filters' : 'Enter a search query to get started'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Search } from './Search'
import type { FileItem, FolderType } from '../lib/types'
import type { SearchResult } from '../hooks/useSearch'
import { formatDate } from '../lib/utils'

export const Dashboard: React.FC = () => {
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null)
  const [currentItems, setCurrentItems] = useState<FileItem[]>([])
  const [recentAnnouncements, setRecentAnnouncements] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)

  const folders = [
    {
      name: "Slides",
      key: "slides" as FolderType,
      emoji: "📊",
      count: 0,
      description: "Lecture slides and presentations",
    },
    {
      name: "Assignments",
      key: "assignments" as FolderType,
      emoji: "📝",
      count: 0,
      description: "Homework and project assignments",
    },
    {
      name: "Links",
      key: "links" as FolderType,
      emoji: "🔗",
      count: 0,
      description: "Useful resources and external links",
    },
    {
      name: "Announcements",
      key: "announcements" as FolderType,
      emoji: "📢",
      count: 0,
      description: "Important class announcements",
    },
  ]

  useEffect(() => {
    fetchRecentAnnouncements()
  }, [])

  const fetchRecentAnnouncements = async () => {
    try {
      const q = query(
        collection(db, 'announcements'),
        orderBy('date', 'desc'),
        limit(2)
      )
      const querySnapshot = await getDocs(q)
      const announcements: FileItem[] = []
      querySnapshot.forEach((doc) => {
        announcements.push({ id: doc.id, ...doc.data() } as FileItem)
      })
      setRecentAnnouncements(announcements)
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  const openFolder = async (folderKey: FolderType) => {
    setLoading(true)
    setCurrentFolder(folderKey)
    
    try {
      const q = query(collection(db, folderKey), orderBy('date', 'desc'))
      const querySnapshot = await getDocs(q)
      const items: FileItem[] = []
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as FileItem)
      })
      setCurrentItems(items)
    } catch (error) {
      console.error(`Error fetching ${folderKey}:`, error)
      setCurrentItems([])
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    setCurrentFolder(null)
    setCurrentItems([])
  }

  const handleSearchResult = (result: SearchResult) => {
    console.log('Selected result:', result)
    
    if (result.url) {
      window.open(result.url, '_blank')
    } else if (result.fileUrl) {
      window.open(result.fileUrl, '_blank')
    }
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
    <div className="min-h-screen min-w-screen w-full bg-gradient-to-br from-black via-purple-950 to-black">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 w-full border-b border-purple-800/30 bg-black/80 backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                🎓
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">DCSDSAGCTU</h1>
                <p className="text-purple-300 text-sm">📚 Class Resource Hub</p>
              </div>
            </div>
            
            {/* Search Bar - Full Width on Mobile */}
            <div className="flex-1 max-w-2xl lg:mx-8">
              <Search onResultClick={handleSearchResult} />
            </div>
            
            {/* Admin Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="border-purple-500 text-purple-300 hover:bg-purple-500/20 bg-transparent"
                onClick={() => window.open('/admin', '_blank')}
              >
                <span className="mr-2">🔐</span>
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-purple-300">
          <button 
            onClick={goBack} 
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <span>🏠</span>
            <span>Home</span>
          </button>
          {currentFolder && (
            <>
              <span>/</span>
              <span className="text-white capitalize flex items-center gap-1">
                <span>{folders.find(f => f.key === currentFolder)?.emoji}</span>
                <span>{currentFolder}</span>
              </span>
            </>
          )}
        </div>

        {!currentFolder ? (
          /* Main Dashboard */
          <div className="w-full">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Welcome to Your Class Hub 🎉
              </h2>
              <p className="text-purple-300 text-lg max-w-3xl mx-auto">
                Access all your course materials, assignments, and announcements in one place. 
                Navigate through folders just like Google Drive! 📂✨
              </p>
            </div>

            {/* Folders Grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
              {folders.map((folder) => (
                <Card
                  key={folder.key}
                  className="bg-black/40 border-purple-800/30 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                  onClick={() => openFolder(folder.key)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {folder.emoji}
                    </div>
                    <CardTitle className="text-white text-xl mb-2">{folder.name}</CardTitle>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      {folder.count} items
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-purple-300 text-sm text-center">{folder.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Announcements */}
            <div className="w-full">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>📢</span>
                Recent Announcements
              </h3>
              <div className="grid gap-4">
                {recentAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="bg-black/40 border-purple-800/30">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-lg mb-2 flex items-center gap-2">
                            <span>📋</span>
                            {announcement.title}
                          </h4>
                          <p className="text-purple-200 mb-3">{announcement.content}</p>
                          <p className="text-purple-400 text-sm flex items-center gap-1">
                            <span>👤</span>
                            By {announcement.uploadedBy}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-purple-500 text-purple-300 shrink-0">
                          {formatDate(announcement.date)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {recentAnnouncements.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-purple-300">No announcements yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Folder View */
          <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white capitalize flex items-center gap-2">
                <span>{folders.find(f => f.key === currentFolder)?.emoji}</span>
                {currentFolder}
              </h2>
              <Button
                onClick={goBack}
                variant="outline"
                className="border-purple-500 text-purple-300 hover:bg-purple-500/20 bg-transparent self-start sm:self-auto"
              >
                <span className="mr-2">←</span>
                Back to Home
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-purple-300">Loading... ⏳</div>
              </div>
            ) : (
              <div className="grid gap-4">
                {currentItems.map((item) => (
                  <Card
                    key={item.id}
                    className="bg-black/40 border-purple-800/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="text-3xl shrink-0">
                          {getFileEmoji(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-lg mb-2 break-words">
                            {item.name || item.title}
                          </h3>
                          {item.content && (
                            <p className="text-purple-200 mb-3 break-words">{item.content}</p>
                          )}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 underline flex items-center gap-1 mb-3 break-all"
                            >
                              <span>🔗</span>
                              <span>{item.url}</span>
                            </a>
                          )}
                          {item.fileUrl && (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 underline flex items-center gap-1 mb-3"
                            >
                              <span>⬇️</span>
                              <span>Download</span>
                            </a>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-purple-400">
                            <span className="flex items-center gap-1">
                              <span>👤</span>
                              <span>{item.uploadedBy}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span>📅</span>
                              <span>{formatDate(item.date)}</span>
                            </span>
                            {item.dueDate && (
                              <Badge variant="destructive" className="bg-red-500/20 text-red-300">
                                ⏰ Due: {formatDate(item.dueDate)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {currentItems.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📂</div>
                <h3 className="text-white text-xl mb-2">No items yet</h3>
                <p className="text-purple-300">This folder is empty. Check back later for updates! 🔄</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-purple-800/30 bg-black/50 backdrop-blur-sm mt-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-purple-300">
            © 2025 DCSDSAGCTU Class Hub. Built for students, by students! 💜✨ Built by <a rel='noopener' href='https://muhaiminsalayk.netlify.app/' target='_blank'>SALAY</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { FileItem, FolderType } from '../lib/types'
import { formatDate, getFileIcon } from '../lib/utils'

export const Dashboard: React.FC = () => {
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null)
  const [currentItems, setCurrentItems] = useState<FileItem[]>([])
  const [recentAnnouncements, setRecentAnnouncements] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)

  const folders = [
    {
      name: "Slides",
      key: "slides" as FolderType,
      icon: "bi-file-earmark-slides",
      count: 0,
      description: "Lecture slides and presentations",
    },
    {
      name: "Assignments",
      key: "assignments" as FolderType,
      icon: "bi-clipboard-check",
      count: 0,
      description: "Homework and project assignments",
    },
    {
      name: "Links",
      key: "links" as FolderType,
      icon: "bi-link-45deg",
      count: 0,
      description: "Useful resources and external links",
    },
    {
      name: "Announcements",
      key: "announcements" as FolderType,
      icon: "bi-megaphone",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                D
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">DCSDSAGCTU</h1>
                <p className="text-purple-300 text-sm">Class Resource Hub</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-purple-500 text-purple-300 hover:bg-purple-500/20 bg-transparent"
              onClick={() => window.open('/admin', '_blank')}
            >
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mb-6 text-purple-300">
          <button onClick={goBack} className="hover:text-white transition-colors flex items-center space-x-1">
            <i className="bi-house"></i>
            <span>Home</span>
          </button>
          {currentFolder && (
            <>
              <span>/</span>
              <span className="text-white capitalize">{currentFolder}</span>
            </>
          )}
        </div>

        {!currentFolder ? (
          /* Main Dashboard */
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Welcome to Your Class Hub</h2>
              <p className="text-purple-300 text-lg max-w-2xl mx-auto">
                Access all your course materials, assignments, and announcements in one place. Navigate through folders
                just like Google Drive.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {folders.map((folder) => (
                <Card
                  key={folder.key}
                  className="bg-black/40 border-purple-800/30 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                  onClick={() => openFolder(folder.key)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      <i className={folder.icon}></i>
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

            {/* Recent Announcements Preview */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-white mb-6">Recent Announcements</h3>
              <div className="space-y-4">
                {recentAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="bg-black/40 border-purple-800/30">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-white font-semibold text-lg">{announcement.title}</h4>
                        <Badge variant="outline" className="border-purple-500 text-purple-300">
                          {formatDate(announcement.date)}
                        </Badge>
                      </div>
                      <p className="text-purple-200 mb-3">{announcement.content}</p>
                      <p className="text-purple-400 text-sm flex items-center space-x-1">
                        <i className="bi-megaphone"></i>
                        <span>By {announcement.uploadedBy}</span>
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Folder View */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white capitalize">{currentFolder}</h2>
              <Button
                onClick={goBack}
                variant="outline"
                className="border-purple-500 text-purple-300 hover:bg-purple-500/20 bg-transparent"
              >
                <i className="bi-arrow-left mr-2"></i>
                Back to Home
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-purple-300">Loading...</div>
              </div>
            ) : (
              <div className="grid gap-4">
                {currentItems.map((item) => (
                  <Card
                    key={item.id}
                    className="bg-black/40 border-purple-800/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl">
                          <i className={getFileIcon(item.type)}></i>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg mb-2">{item.name || item.title}</h3>
                          {item.content && <p className="text-purple-200 mb-3">{item.content}</p>}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 underline flex items-center space-x-1"
                            >
                              <i className="bi-box-arrow-up-right"></i>
                              <span>{item.url}</span>
                            </a>
                          )}
                          {item.fileUrl && (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 underline flex items-center space-x-1"
                            >
                              <i className="bi-download"></i>
                              <span>Download</span>
                            </a>
                          )}
                          <div className="flex items-center space-x-4 mt-3 text-sm text-purple-400">
                            <span className="flex items-center space-x-1">
                              <i className="bi-person"></i>
                              <span>{item.uploadedBy}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <i className="bi-calendar"></i>
                              <span>{formatDate(item.date)}</span>
                            </span>
                            {item.dueDate && (
                              <Badge variant="destructive" className="bg-red-500/20 text-red-300">
                                Due: {formatDate(item.dueDate)}
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
              <div className="text-center py-12">
                <div className="text-6xl mb-4">
                  <i className="bi-folder"></i>
                </div>
                <h3 className="text-white text-xl mb-2">No items yet</h3>
                <p className="text-purple-300">This folder is empty. Check back later for updates.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-800/30 bg-black/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-purple-300">© 2025 DCS & DSA GCTU Class Hub. Built by <a href='https://muhaiminsalayk.netlify.app/'>SALAY</a>.</p>
        </div>
      </footer>
    </div>
  )
}
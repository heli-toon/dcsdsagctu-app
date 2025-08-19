import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Badge } from './ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs'
import type { User, FileItem } from '../lib/types'
import { formatDate } from '../lib/utils'
import { supabase, ADMIN_EMAILS } from '../lib/supabase'

export const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const [allContent, setAllContent] = useState<FileItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Form states
  const [uploadForm, setUploadForm] = useState({
    category: 'slides',
    title: '',
    file: null as File | null,
    dueDate: ''
  })

  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    description: ''
  })

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: ''
  })

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user
      if (user && ADMIN_EMAILS.includes(user.email || '')) {
        setUser({
          uid: user.id,
          email: user.email || '',
          displayName: user.user_metadata.full_name || user.email || '',
          isAdmin: true
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      if (user && ADMIN_EMAILS.includes(user.email || '')) {
        setUser({
          uid: user.id,
          email: user.email || '',
          displayName: user.user_metadata.full_name || user.email || '',
          isAdmin: true
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchAllContent()
    }
  }, [user])

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      await supabase.auth.signInWithOAuth({ provider: 'google' })
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed. Please try again. 😞')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const fetchAllContent = async () => {
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
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.file || !user) return
    try {
      setUploading(true)
      // Upload file to Supabase Storage
      const filePath = `${uploadForm.category}/${Date.now()}_${uploadForm.file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, uploadForm.file)
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('files').getPublicUrl(filePath)
      const downloadURL = urlData.publicUrl

      // Insert file metadata into table
      const { error: insertError } = await supabase
        .from(uploadForm.category)
        .insert([{
          name: uploadForm.title,
          fileName: uploadForm.file.name,
          fileUrl: downloadURL,
          uploadedBy: user.displayName,
          date: new Date().toISOString(),
          dueDate: uploadForm.dueDate || null,
          type: uploadForm.file.type
        }])
      if (insertError) throw insertError

      setUploadForm({
        category: 'slides',
        title: '',
        file: null,
        dueDate: ''
      })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      fetchAllContent()
      alert('File uploaded successfully! 🎉')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading file. Please try again. 😞')
    } finally {
      setUploading(false)
    }
  }

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const { error } = await supabase
        .from('links')
        .insert([{
          name: linkForm.title,
          url: linkForm.url,
          content: linkForm.description,
          uploadedBy: user.displayName,
          date: new Date().toISOString(),
          type: 'link'
        }])
      if (error) throw error
      setLinkForm({ title: '', url: '', description: '' })
      fetchAllContent()
      alert('Link added successfully! 🔗✨')
    } catch (error) {
      console.error('Link submission error:', error)
      alert('Error adding link. Please try again. 😞')
    }
  }

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const { error } = await supabase
        .from('announcements')
        .insert([{
          title: announcementForm.title,
          content: announcementForm.content,
          uploadedBy: user.displayName,
          date: new Date().toISOString(),
          type: 'announcement'
        }])
      if (error) throw error
      setAnnouncementForm({ title: '', content: '' })
      fetchAllContent()
      alert('Announcement posted successfully! 📢🎉')
    } catch (error) {
      console.error('Announcement submission error:', error)
      alert('Error posting announcement. Please try again. 😞')
    }
  }

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Are you sure you want to delete this item? 🗑️')) return
    try {
      const { error } = await supabase
        .from(type)
        .delete()
        .eq('id', id)
      if (error) throw error
      fetchAllContent()
      alert('Item deleted successfully! ✅')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Error deleting item. Please try again. 😞')
    }
  }

  const filteredContent = allContent.filter(item => {
    if (!searchQuery.trim()) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      (item.name || item.title || '').toLowerCase().includes(searchLower) ||
      (item.content || '').toLowerCase().includes(searchLower) ||
      item.uploadedBy.toLowerCase().includes(searchLower) ||
      item.type.toLowerCase().includes(searchLower)
    )
  })

  const getFileEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case "slides":
        return "📊"
      case "assignments":
        return "📝"
      case "links":
        return "🔗"
      case "announcements":
        return "📢"
      default:
        return "📁"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen min-w-screen w-full bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-300">Loading... ⏳</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen min-w-screen w-full bg-gradient-to-br from-black via-purple-950 to-black">
        <div className="w-full h-full flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-black/40 border-purple-800/30 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl mx-auto">
                🔐
              </div>
              <div>
                <CardTitle className="text-white text-2xl mb-2">Admin Access 👨‍💼</CardTitle>
                <p className="text-purple-300">
                  Sign in with your authorized Google account to access the admin dashboard 🚀
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 text-lg"
              >
                <span className="mr-3">🔍</span>
                {loading ? 'Signing in... ⏳' : 'Sign in with Google'}
              </Button>
              
              <div className="text-center">
                <p className="text-purple-400 text-sm mb-2">
                  Only authorized users can access this area 🛡️
                </p>
                <Button
                  variant="ghost"
                  onClick={() => window.open('/', '_self')}
                  className="text-purple-300 hover:text-white text-sm"
                >
                  <span className="mr-2">←</span>
                  Back to Main Site
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-screen w-full bg-gradient-to-br from-black via-purple-950 to-black">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 w-full border-b border-purple-800/30 bg-black/80 backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-lg">
                ⚙️
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Dashboard 👨‍💼</h1>
                <p className="text-purple-300 text-sm">Welcome, {user.displayName}! 👋</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500 text-purple-300 hover:bg-purple-500/20 bg-transparent"
                onClick={() => window.open('/', '_blank')}
              >
                <span className="mr-1 sm:mr-2">🏠</span>
                <span className="hidden sm:inline">View Site</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="sm"
                className="bg-red-500/20 border-red-500 text-red-300 hover:bg-red-500/30"
              >
                <span className="mr-1 sm:mr-2">🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-purple-800/30">
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white text-purple-300"
            >
              <span className="mr-1 sm:mr-2">📤</span>
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white text-purple-300"
            >
              <span className="mr-1 sm:mr-2">📁</span>
              <span className="hidden sm:inline">Manage</span>
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white text-purple-300"
            >
              <span className="mr-1 sm:mr-2">📢</span>
              <span className="hidden sm:inline">Announce</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="w-full space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* File Upload */}
              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span>📤</span>
                    <span>Upload Files</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">📂 Category</label>
                      <select 
                        title='Select file category'
                        value={uploadForm.category}
                        onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                        className="w-full bg-black/60 border border-purple-800/30 rounded-md px-3 py-2 text-white"
                      >
                        <option value="slides">📊 Slides</option>
                        <option value="assignments">📝 Assignments</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">📎 File</label>
                      <Input
                        type="file"
                        onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                        className="w-full bg-black/60 border-purple-800/30 text-white file:bg-purple-500/20 file:text-purple-300 file:border-0 file:rounded file:px-3 file:py-1 file:mr-3"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">📝 Title</label>
                      <Input
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                        placeholder="Enter file title"
                        className="w-full bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
                        required
                      />
                    </div>
                    {uploadForm.category === 'assignments' && (
                      <div>
                        <label className="text-purple-300 text-sm mb-2 block">⏰ Due Date (Optional)</label>
                        <Input
                          type="date"
                          value={uploadForm.dueDate}
                          onChange={(e) => setUploadForm({...uploadForm, dueDate: e.target.value})}
                          className="w-full bg-black/60 border-purple-800/30 text-white"
                        />
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Uploading... ⏳
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🚀</span>
                          Upload File
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Add Link */}
              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span>🔗</span>
                    <span>Add Link</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLinkSubmit} className="space-y-4">
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">📝 Link Title</label>
                      <Input
                        value={linkForm.title}
                        onChange={(e) => setLinkForm({...linkForm, title: e.target.value})}
                        placeholder="Enter link title"
                        className="w-full bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">🌐 URL</label>
                      <Input
                        type="url"
                        value={linkForm.url}
                        onChange={(e) => setLinkForm({...linkForm, url: e.target.value})}
                        placeholder="https://example.com"
                        className="w-full bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">📄 Description</label>
                      <Textarea
                        value={linkForm.description}
                        onChange={(e) => setLinkForm({...linkForm, description: e.target.value})}
                        placeholder="Brief description of the link"
                        className="w-full bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
                        rows={3}
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <span className="mr-2">➕</span>
                      Add Link
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Create Announcement */}
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span>📢</span>
                  <span>Create Announcement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <label className="text-purple-300 text-sm mb-2 block">📝 Title</label>
                      <Input
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                        placeholder="Announcement title"
                        className="w-full bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <span className="mr-2">📤</span>
                        Post Announcement
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-purple-300 text-sm mb-2 block">📄 Content</label>
                    <Textarea
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                      placeholder="Write your announcement here..."
                      className="w-full bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400 min-h-[100px]"
                      required
                    />
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="w-full space-y-6">
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <span>📁</span>
                    Content Management
                  </CardTitle>
                  <div className="w-full lg:w-80">
                    <Input
                      type="text"
                      placeholder="🔍 Search content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredContent.length > 0 ? (
                  <div className="space-y-4">
                    {filteredContent.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 bg-black/60 rounded-lg border border-purple-800/30 gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-2xl shrink-0">{getFileEmoji(item.type)}</span>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-white font-medium break-words">{item.name || item.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-purple-400">
                              <span className="flex items-center gap-1">
                                <span>📅</span>
                                {formatDate(item.date)}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span>👤</span>
                                {item.uploadedBy}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="border-purple-500 text-purple-300">
                            {item.type}
                          </Badge>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                            onClick={() => handleDelete(item.id, item.type)}
                          >
                            <span>🗑️</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📂</div>
                    <h4 className="text-white text-lg mb-2">
                      {searchQuery ? 'No matching content found 🔍' : 'No content yet 📭'}
                    </h4>
                    <p className="text-purple-300">
                      {searchQuery ? 'Try different search terms 🔄' : 'Upload some files to get started! 🚀'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="w-full space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Create Announcement Form */}
              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span>📢</span>
                    <span>Create Announcement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">📝 Title</label>
                      <Input
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                        placeholder="Announcement title"
                        className="w-full bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">📄 Content</label>
                      <Textarea
                        value={announcementForm.content}
                        onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                        placeholder="Write your announcement here..."
                        className="w-full bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400 min-h-[120px]"
                        required
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <span className="mr-2">📤</span>
                      Post Announcement
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Recent Announcements */}
              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span>🕒</span>
                    <span>Recent Announcements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {allContent
                      .filter(item => item.type === 'announcements')
                      .slice(0, 5)
                      .map((announcement) => (
                        <div
                          key={announcement.id}
                          className="p-3 bg-black/40 rounded-lg border border-purple-800/20"
                        >
                          <h5 className="text-white font-medium text-sm mb-1 flex items-center gap-1">
                            <span>📋</span>
                            {announcement.title}
                          </h5>
                          <p className="text-purple-200 text-xs mb-2 line-clamp-2">
                            {announcement.content}
                          </p>
                          <div className="flex items-center justify-between text-xs text-purple-400">
                            <span className="flex items-center gap-1">
                              <span>👤</span>
                              {announcement.uploadedBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>📅</span>
                              {formatDate(announcement.date)}
                            </span>
                          </div>
                        </div>
                      ))}
                    {allContent.filter(item => item.type === 'announcements').length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-3xl mb-2">📭</div>
                        <p className="text-purple-300 text-sm">No announcements yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, googleProvider, db, storage, ADMIN_EMAILS } from '../lib/firebase'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Badge } from './ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs'
import type { User, FileItem } from '../lib/types'
import { formatDate, getFileIcon } from '../lib/utils'

export const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upload')
  const [allContent, setAllContent] = useState<FileItem[]>([])

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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && ADMIN_EMAILS.includes(firebaseUser.email || '')) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          isAdmin: true
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAllContent()
    }
  }, [user])

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const fetchAllContent = async () => {
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
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.file || !user) return

    try {
      setLoading(true)
      
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `${uploadForm.category}/${uploadForm.file.name}`)
      const snapshot = await uploadBytes(storageRef, uploadForm.file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Add document to Firestore
      await addDoc(collection(db, uploadForm.category), {
        name: uploadForm.title,
        fileName: uploadForm.file.name,
        fileUrl: downloadURL,
        uploadedBy: user.displayName,
        date: new Date().toISOString(),
        dueDate: uploadForm.dueDate || null,
        type: uploadForm.file.type
      })

      // Reset form
      setUploadForm({
        category: 'slides',
        title: '',
        file: null,
        dueDate: ''
      })

      fetchAllContent()
      alert('File uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading file')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await addDoc(collection(db, 'links'), {
        name: linkForm.title,
        url: linkForm.url,
        content: linkForm.description,
        uploadedBy: user.displayName,
        date: new Date().toISOString(),
        type: 'link'
      })

      setLinkForm({ title: '', url: '', description: '' })
      fetchAllContent()
      alert('Link added successfully!')
    } catch (error) {
      console.error('Link submission error:', error)
      alert('Error adding link')
    }
  }

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await addDoc(collection(db, 'announcements'), {
        title: announcementForm.title,
        content: announcementForm.content,
        uploadedBy: user.displayName,
        date: new Date().toISOString(),
        type: 'announcement'
      })

      setAnnouncementForm({ title: '', content: '' })
      fetchAllContent()
      alert('Announcement posted successfully!')
    } catch (error) {
      console.error('Announcement submission error:', error)
      alert('Error posting announcement')
    }
  }

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await deleteDoc(doc(db, type, id))
      fetchAllContent()
      alert('Item deleted successfully!')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Error deleting item')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center">
        <div className="text-purple-300">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center">
        <Card className="w-full max-w-md bg-black/40 border-purple-800/30">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              <i className="bi-lock"></i>
            </div>
            <CardTitle className="text-white text-2xl">Admin Login</CardTitle>
            <p className="text-purple-300">Only authorized users can access this area</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <i className="bi-google mr-2"></i>
              Sign in with Google
            </Button>
            <p className="text-purple-400 text-sm text-center">Contact your class representative for access</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-purple-300 text-sm">Welcome, {user.displayName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="border-purple-500 text-purple-300 hover:bg-purple-500/20 bg-transparent"
                onClick={() => window.open('/', '_blank')}
              >
                View Public Site
              </Button>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="bg-red-500/20 border-red-500 text-red-300 hover:bg-red-500/30"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-black/40 border border-purple-800/30">
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="manage">Manage Content</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Upload */}
              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <i className="bi-cloud-upload"></i>
                    <span>Upload Files</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">Category</label>
                      <select 
                        title='Category'
                        value={uploadForm.category}
                        onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                        className="w-full bg-black/60 border border-purple-800/30 rounded-md px-3 py-2 text-white"
                      >
                        <option value="slides">Slides</option>
                        <option value="assignments">Assignments</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">File</label>
                      <Input
                        type="file"
                        onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                        className="bg-black/60 border-purple-800/30 text-white file:bg-purple-500/20 file:text-purple-300 file:border-0"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">Title</label>
                      <Input
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                        placeholder="Enter file title"
                        className="bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
                        required
                      />
                    </div>
                    {uploadForm.category === 'assignments' && (
                      <div>
                        <label className="text-purple-300 text-sm mb-2 block">Due Date (Optional)</label>
                        <Input
                          type="date"
                          value={uploadForm.dueDate}
                          onChange={(e) => setUploadForm({...uploadForm, dueDate: e.target.value})}
                          className="bg-black/60 border-purple-800/30 text-white"
                        />
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      disabled={loading}
                    >
                      {loading ? 'Uploading...' : 'Upload File'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Add Link */}
              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <i className="bi-link-45deg"></i>
                    <span>Add Link</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLinkSubmit} className="space-y-4">
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">Link Title</label>
                      <Input
                        value={linkForm.title}
                        onChange={(e) => setLinkForm({...linkForm, title: e.target.value})}
                        placeholder="Enter link title"
                        className="bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">URL</label>
                      <Input
                        type="url"
                        value={linkForm.url}
                        onChange={(e) => setLinkForm({...linkForm, url: e.target.value})}
                        placeholder="https://example.com"
                        className="bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-purple-300 text-sm mb-2 block">Description</label>
                      <Textarea
                        value={linkForm.description}
                        onChange={(e) => setLinkForm({...linkForm, description: e.target.value})}
                        placeholder="Brief description of the link"
                        className="bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Add Link
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white">Content Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allContent.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-black/60 rounded-lg border border-purple-800/30"
                    >
                      <div className="flex items-center space-x-3">
                        <i className={`text-2xl ${getFileIcon(item.type)}`}></i>
                        <div>
                          <h4 className="text-white font-medium">{item.name || item.title}</h4>
                          <p className="text-purple-400 text-sm">{formatDate(item.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="border-purple-500 text-purple-300">
                          {item.type}
                        </Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                          onClick={() => handleDelete(item.id, item.type)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <i className="bi-megaphone"></i>
                  <span>Create Announcement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                  <div>
                    <label className="text-purple-300 text-sm mb-2 block">Title</label>
                    <Input
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                      placeholder="Announcement title"
                      className="bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-purple-300 text-sm mb-2 block">Content</label>
                    <Textarea
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                      placeholder="Write your announcement here..."
                      className="bg-black/60 border-purple-800/30 text-white placeholder:text-purple-400 min-h-[120px]"
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Post Announcement
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-black/40 border-purple-800/30">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">
                    <i className="bi-file-earmark-slides"></i>
                  </div>
                  <h3 className="text-white text-lg font-semibold">Slides</h3>
                  <p className="text-purple-300 text-2xl font-bold">
                    {allContent.filter(item => item.type === 'slides').length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-black/40 border-purple-800/30">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">
                    <i className="bi-clipboard-check"></i>
                  </div>
                  <h3 className="text-white text-lg font-semibold">Assignments</h3>
                  <p className="text-purple-300 text-2xl font-bold">
                    {allContent.filter(item => item.type === 'assignments').length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-black/40 border-purple-800/30">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">
                    <i className="bi-link-45deg"></i>
                  </div>
                  <h3 className="text-white text-lg font-semibold">Links</h3>
                  <p className="text-purple-300 text-2xl font-bold">
                    {allContent.filter(item => item.type === 'links').length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-black/40 border-purple-800/30">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">
                    <i className="bi-megaphone"></i>
                  </div>
                  <h3 className="text-white text-lg font-semibold">Announcements</h3>
                  <p className="text-purple-300 text-2xl font-bold">
                    {allContent.filter(item => item.type === 'announcements').length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
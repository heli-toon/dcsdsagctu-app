export type FolderType = "slides" | "assignments" | "links" | "announcements"

export interface FileItem {
  id: string
  name?: string
  title?: string
  content?: string
  url?: string
  uploadedBy: string
  date: string
  dueDate?: string
  type: string
  fileName?: string
  fileUrl?: string
}

export interface User {
  uid: string
  email: string
  displayName: string
  isAdmin: boolean
}

export interface Announcement {
  id: string
  title: string
  content: string
  uploadedBy: string
  date: string
  type: "announcement"
}
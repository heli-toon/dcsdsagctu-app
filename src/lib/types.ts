export type FolderType = "slides" | "assignments" | "links" | "announcements"

export interface FileItem {
  id: string
  name?: string
  title?: string
  content?: string
  url?: string
  uploadedby: string
  date: string
  duedate?: string
  type: string
  filename?: string
  fileurl?: string
}

export interface User {
  uid: string
  email: string
  displayName: string
  isadmin: boolean
}

export interface Announcement {
  id: string
  title: string
  content: string
  uploadedby: string
  date: string
  type: "announcement"
}
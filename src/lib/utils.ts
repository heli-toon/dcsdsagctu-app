import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "pdf":
      return "bi-file-earmark-pdf"
    case "pptx":
    case "ppt":
      return "bi-file-earmark-slides"
    case "docx":
    case "doc":
      return "bi-file-earmark-word"
    case "link":
      return "bi-link-45deg"
    case "assignment":
      return "bi-clipboard-check"
    case "announcement":
      return "bi-megaphone"
    default:
      return "bi-folder"
  }
}
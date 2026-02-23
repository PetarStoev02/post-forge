import { BACKEND_ORIGIN } from "@/lib/config"

type UploadOptions = {
  onProgress?: (percent: number) => void
}

export const deleteMedia = async (url: string): Promise<void> => {
  const response = await fetch(`${BACKEND_ORIGIN}/api/media`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    throw new Error("Failed to delete media")
  }
}

export const uploadMedia = (file: File, options?: UploadOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append("file", file)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${BACKEND_ORIGIN}/api/media/upload`)
    xhr.withCredentials = true

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && options?.onProgress) {
        options.onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data: { url: string } = JSON.parse(xhr.responseText)
          resolve(data.url)
        } catch {
          reject(new Error("Invalid response"))
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText)
          reject(new Error(error?.message ?? "Upload failed"))
        } catch {
          reject(new Error("Upload failed"))
        }
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"))
    })

    xhr.send(formData)
  })
}

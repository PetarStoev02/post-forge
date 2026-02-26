const normalizeDate = (dateString: string): Date =>
  new Date(dateString.replace(" ", "T"))

export const formatDateTime = (dateString: string): string =>
  normalizeDate(dateString).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

export const formatDate = (dateString: string): string =>
  normalizeDate(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

export const formatScheduledTime = (scheduledAt: string | null | undefined): string => {
  if (!scheduledAt) return "No date"
  return normalizeDate(scheduledAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export const formatDateForInput = (dateString: string): { date: Date; time: string } => {
  const date = normalizeDate(dateString)
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return { date, time: `${hours}:${minutes}` }
}

export const buildScheduledAt = (date: Date, time: string): string => {
  const [hours, minutes] = time.split(":").map(Number)
  const d = new Date(date)
  d.setHours(hours, minutes, 0, 0)
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(hours)}:${pad(minutes)}:00`
}

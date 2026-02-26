import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CalendarView = 'week' | 'month'

type CalendarState = {
  view: CalendarView
  currentDate: string
  setView: (view: CalendarView) => void
  setCurrentDate: (date: Date) => void
  goToPrevious: () => void
  goToNext: () => void
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      view: 'week',
      currentDate: new Date().toISOString(),

      setView: (view) => set({ view }),

      setCurrentDate: (date) => set({ currentDate: date.toISOString() }),

      goToPrevious: () => {
        const { view, currentDate } = get()
        const date = new Date(currentDate)
        if (view === 'week') {
          date.setDate(date.getDate() - 7)
        } else {
          date.setMonth(date.getMonth() - 1)
        }
        set({ currentDate: date.toISOString() })
      },

      goToNext: () => {
        const { view, currentDate } = get()
        const date = new Date(currentDate)
        if (view === 'week') {
          date.setDate(date.getDate() + 7)
        } else {
          date.setMonth(date.getMonth() + 1)
        }
        set({ currentDate: date.toISOString() })
      },
    }),
    { name: 'calendar-storage' }
  )
)

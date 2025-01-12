import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ViewStore {
  view: string
  setView: (view: string) => void
}

export const useView = create<ViewStore>()(
  persist(
    (set) => ({
      view: 'feed',
      setView: (view) => set({ view }),
    }),
    {
      name: 'view-store',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

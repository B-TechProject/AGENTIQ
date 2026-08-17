import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  icon?: string
}

interface ToastState {
  toasts: Toast[]
  show: (message: string, type?: ToastType, icon?: string) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, type = 'success', icon) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, icon }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 3000)
  },
  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

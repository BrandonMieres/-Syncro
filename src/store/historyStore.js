import { create } from 'zustand';

export const useHistoryStore = create((set) => ({
  logs: [],
  isLoading: false,
  error: null,

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setLogs: (logs) => set({ logs, isLoading: false }),
}));

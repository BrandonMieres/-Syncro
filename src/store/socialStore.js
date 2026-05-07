import { create } from 'zustand';

export const useSocialStore = create((set) => ({
  accounts: {}, // { reddit: true, x: false, ... }
  isLoading: false,
  error: null,

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  
  setAccounts: (accounts) => set({ accounts, isLoading: false }),
  updateAccountStatus: (platform, status) => set((state) => ({
    accounts: { ...state.accounts, [platform]: status }
  })),
}));

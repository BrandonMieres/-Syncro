import { create } from 'zustand';

export const useTemplateStore = create((set) => ({
  templates: {}, // { reddit: '...', x: '...' }
  isLoading: false,
  error: null,

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  
  setTemplates: (templates) => set({ templates, isLoading: false }),
  updateTemplate: (platform, template) => set((state) => ({
    templates: { ...state.templates, [platform]: template }
  })),
}));

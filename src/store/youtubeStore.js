import { create } from 'zustand';

export const useYoutubeStore = create((set) => ({
  channels: [],
  selectedChannel: null,
  videos: [],
  selectedVideo: null, // NUEVO
  isLoading: false,
  error: null,

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  
  setChannels: (channels) => set({ channels, isLoading: false }),
  setSelectedChannel: (channel) => set({ selectedChannel: channel, videos: [], selectedVideo: null }),
  setSelectedVideo: (video) => set({ selectedVideo: video }), // NUEVO
  setVideos: (videos) => set({ videos, isLoading: false }),
  
  addChannel: (channel) => set((state) => ({ 
    channels: [...state.channels, channel] 
  })),
}));

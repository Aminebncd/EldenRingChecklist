import { create } from 'zustand';

interface FiltersState {
  category?: string;
  region?: string;
  location?: string;
  expansion?: 'base' | 'sote';
  q: string;
  setCategory: (v?: string) => void;
  setRegion: (v?: string) => void;
  setLocation: (v?: string) => void;
  setExpansion: (v?: 'base' | 'sote') => void;
  setQ: (v: string) => void;
}

export const useFilters = create<FiltersState>((set) => ({
  category: undefined,
  region: undefined,
  location: undefined,
  expansion: undefined,
  q: '',
  setCategory: (category) => set({ category }),
  setRegion: (region) => set({ region }),
  setLocation: (location) => set({ location }),
  setExpansion: (expansion) => set({ expansion }),
  setQ: (q) => set({ q })
}));

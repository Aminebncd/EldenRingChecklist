import { create } from 'zustand';

interface FiltersState {
  category?: string;
  region?: string;
  q: string;
  setCategory: (v?: string) => void;
  setRegion: (v?: string) => void;
  setQ: (v: string) => void;
}

export const useFilters = create<FiltersState>((set) => ({
  category: undefined,
  region: undefined,
  q: '',
  setCategory: (category) => set({ category }),
  setRegion: (region) => set({ region }),
  setQ: (q) => set({ q })
}));

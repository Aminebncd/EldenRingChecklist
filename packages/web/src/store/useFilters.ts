import { create } from 'zustand';

interface FiltersState {
  category?: string;
  region?: string;
  expansion?: 'base' | 'sote';
  q: string;
  setCategory: (v?: string) => void;
  setRegion: (v?: string) => void;
  setExpansion: (v?: 'base' | 'sote') => void;
  setQ: (v: string) => void;
}

export const useFilters = create<FiltersState>((set) => ({
  category: undefined,
  region: undefined,
  expansion: undefined,
  q: '',
  setCategory: (category) => set({ category }),
  setRegion: (region) => set({ region }),
  setExpansion: (expansion) => set({ expansion }),
  setQ: (q) => set({ q })
}));

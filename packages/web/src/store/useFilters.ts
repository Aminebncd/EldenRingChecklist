import { create } from 'zustand';

interface State {
  category: string;
  region: string;
  q: string;
  setCategory: (v: string) => void;
  setRegion: (v: string) => void;
  setQ: (v: string) => void;
}

export const useFilters = create<State>((set) => ({
  category: '',
  region: '',
  q: '',
  setCategory: (category) => set({ category }),
  setRegion: (region) => set({ region }),
  setQ: (q) => set({ q }),
}));

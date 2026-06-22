// store/countyStore.ts
import { create } from "zustand";

interface County {
  id: string;
  name: string;
  slug: string;
}

interface CountyState {
  popularCounties: County[];
  setPopularCounties: (counties: County[]) => void;
  clearPopularCounties: () => void;
}

export const useCountyStore = create<CountyState>((set) => ({
  popularCounties: [],

  setPopularCounties: (counties: County[]) =>
    set({ popularCounties: counties }),

  clearPopularCounties: () => set({ popularCounties: [] }),
}));

// ✅ Simple selector
export const usePopularCounties = () =>
  useCountyStore((state) => state.popularCounties);

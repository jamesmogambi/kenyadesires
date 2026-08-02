import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface BDSMItem {
  id: number;
  name: string;
  value: string;
  count: number;
}

export interface BDSMState {
  bdsms: BDSMItem[];
  isLoading: boolean;
  error: string | null;

  setBDSMs: (bdsms: BDSMItem[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  addBDSM: (bdsm: BDSMItem) => void;
  removeBDSM: (id: number) => void;
  updateBDSM: (id: number, name: string) => void;
  hydrate: (data: Partial<BDSMState>) => void;
  clear: () => void;
}

export const useBDSMStore = create<BDSMState>()(
  devtools(
    persist(
      (set) => ({
        bdsms: [],
        isLoading: false,
        error: null,

        setBDSMs: (bdsms) => set({ bdsms }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        addBDSM: (bdsm) =>
          set((state) => ({
            bdsms: [...state.bdsms, bdsm],
          })),

        removeBDSM: (id) =>
          set((state) => ({
            bdsms: state.bdsms.filter((b) => b.id !== id),
          })),

        updateBDSM: (id, name) =>
          set((state) => ({
            bdsms: state.bdsms.map((b) =>
              b.id === id ? { ...b, name, value: name } : b,
            ),
          })),

        hydrate: (data) => set({ ...data }),
        clear: () =>
          set({ bdsms: [], isLoading: false, error: null }),
      }),
      {
        name: "bdsm-store",
      },
    ),
  ),
);

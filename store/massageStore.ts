import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface MassageItem {
  id: number;
  name: string;
  value: string;
  count: number;
}

export interface MassageState {
  massages: MassageItem[];
  isLoading: boolean;
  error: string | null;

  setMassages: (massages: MassageItem[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  addMassage: (massage: MassageItem) => void;
  removeMassage: (id: number) => void;
  updateMassage: (id: number, name: string) => void;
  hydrate: (data: Partial<MassageState>) => void;
  clear: () => void;
}

export const useMassageStore = create<MassageState>()(
  devtools(
    persist(
      (set, get) => ({
        massages: [],
        isLoading: false,
        error: null,

        setMassages: (massages) => set({ massages }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        addMassage: (massage) =>
          set((state) => ({
            massages: [...state.massages, massage],
          })),

        removeMassage: (id) =>
          set((state) => ({
            massages: state.massages.filter((m) => m.id !== id),
          })),

        updateMassage: (id, name) =>
          set((state) => ({
            massages: state.massages.map((m) =>
              m.id === id ? { ...m, name, value: name } : m,
            ),
          })),

        hydrate: (data) => set({ ...data }),
        clear: () =>
          set({ massages: [], isLoading: false, error: null }),
      }),
      {
        name: "massage-store",
      },
    ),
  ),
);

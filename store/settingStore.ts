// stores/SettingStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingStore {
  selected: string[];
  massages: string[];
  bdsm: string[];
  toggle: (name: string) => void;
  toggleMassage: (name: string) => void;
  toggleBdsm: (name: string) => void;
  clearAll: () => void;
  tab: string;
  setTab: (value: string) => void;
  languages: string[];
  availability: string[];
  setAvailability: (name: string, checked: boolean) => void;

  setLanguage: (name: string, checked: boolean) => void;
  clearLanguages: () => void;
  categories: string[];
  setCategory: (name: string, checked: boolean) => void;
  clearCategories: () => void;
}

export const useSettingStore = create<SettingStore>()(
  persist(
    (set, get) => ({
      selected: [],
      massages: [],
      bdsm: [],
      tab: "practices", // default tab
      setTab: (value) => set({ tab: value }),
      categories: [],
      languages: [],
      availability: [],
      setAvailability: (name, checked) => {
        const current = get().availability;
        const updated = checked
          ? [...new Set([...current, name])]
          : current.filter((l) => l !== name);
        set({ availability: updated });
      },
      setLanguage: (name, checked) => {
        const current = get().languages;
        const updated = checked
          ? [...new Set([...current, name])]
          : current.filter((l) => l !== name);
        set({ languages: updated });
      },
      clearLanguages: () => set({ languages: [] }),

      setCategory: (name, checked) => {
        const current = get().categories;
        const updated = checked
          ? [...new Set([...current, name])]
          : current.filter((c) => c !== name);
        set({ categories: updated });
      },
      clearCategories: () => set({ categories: [] }),

      toggle: (name) =>
        set((state) => ({
          selected: state.selected.includes(name)
            ? state.selected.filter((item) => item !== name)
            : [...state.selected, name],
        })),
      toggleMassage: (name) =>
        set((state) => ({
          massages: state.massages.includes(name)
            ? state.massages.filter((item) => item !== name)
            : [...state.massages, name],
        })),
      toggleBdsm: (name) =>
        set((state) => ({
          bdsm: state.bdsm.includes(name)
            ? state.bdsm.filter((item) => item !== name)
            : [...state.bdsm, name],
        })),
      clearAll: () => set({ selected: [], massages: [], bdsm: [], availability: [], languages: [], categories: [] }),
    }),
    { name: "Setting-selection" }
  )
);
function get() {
  throw new Error("Function not implemented.");
}

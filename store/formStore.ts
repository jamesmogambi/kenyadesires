//

import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  region: string;
  county: string;
  towns: string[];
  description: string;
  age: string;
  breast: string;
  character: string;
  hairColor: string;
  nationality: string;
  experience: string;
  tags: string[];
  files: FileList | null;
  setFiles: (files: FileList) => void;
  clearFiles: () => void;
  setRegion: (region: string) => void;
  setCounty: (county: string) => void;
  setTown: (town: string) => void;
  removeTown: (town: string) => void;
  setDescription: (description: string) => void;
  setAge: (age: string) => void;
  setBreast: (breast: string) => void;
  setCharacter: (character: string) => void;
  setHairColor: (hairColor: string) => void;
  setNationality: (nationality: string) => void;
  setExperience: (experience: string) => void;
  setTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  clearTags: () => void;
  clearDescription: () => void;
  reset: () => void;
};

// N/B: 'City belongs to region e.g Umoje, Buru Buru cities belong to Nairobi region'
export const useFormStore = create(
  persist<State>(
    (set) => ({
      region: "",
      county: "",
      towns: [],
      description: "",
      age: "",
      breast: "",
      character: "",
      hairColor: "",
      nationality: "",
      experience: "",
      tags: [],
      files: null,
      setFiles: (files) => set({ files }),
      clearFiles: () => set({ files: null }),
      setRegion: (region) => set({ region, county: "", towns: [] }),
      setCounty: (county) => set({ county, towns: [] }),
      setTown: (town) =>
        set((state) =>
          state.towns.includes(town)
            ? state
            : { towns: [...state.towns, town] },
        ),
      removeTown: (town) =>
        set((state) => ({
          towns: state.towns.filter((t) => t !== town),
        })),
      setDescription: (description) => set({ description }),
      setAge: (age) => set({ age }),
      setBreast: (breast) => set({ breast }),
      setCharacter: (character) => set({ character }),
      setHairColor: (hairColor) => set({ hairColor }),
      setNationality: (nationality) => set({ nationality }),
      setExperience: (experience) => set({ experience }),
      setTags: (tags) => set({ tags }),
      addTag: (tag) =>
        set((state) =>
          state.tags.includes(tag) ? state : { tags: [...state.tags, tag] },
        ),

      removeTag: (tag) =>
        set((state) => ({
          tags: state.tags.filter((t) => t !== tag),
        })),

      clearTags: () => set({ tags: [] }),

      clearDescription: () => set({ description: "" }),

      reset: () =>
        set({
          region: "",
          county: "",
          towns: [],
          description: "",
          age: "",
          breast: "",
          character: "",
          hairColor: "",
          nationality: "",
          experience: "",
          tags: [],
        }),
    }),
    {
      name: "form-store", // localStorage key
    },
  ),
);

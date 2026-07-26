// store/fileStore.ts
import { create } from "zustand";

interface FileStore {
  existingImages: string[];
  files: File[];

  setExistingImages: (urls: string[]) => void;
  addFiles: (files: File[]) => void;
  removeExistingImage: (url: string) => void;
  removeFile: (index: number) => void;

  clearFiles: () => void;
}

export const useFileStore = create<FileStore>((set) => ({
  existingImages: [],
  files: [],

  setExistingImages: (urls) => set({ existingImages: urls }),

  addFiles: (newFiles) =>
    set((state) => ({
      files: [...state.files, ...newFiles],
    })),

  removeExistingImage: (url) =>
    set((state) => ({
      existingImages: state.existingImages.filter((img) => img !== url),
    })),

  removeFile: (index) =>
    set((state) => ({
      files: state.files.filter((_, i) => i !== index),
    })),

  clearFiles: () =>
    set({
      files: [],
      existingImages: [],
    }),
}));

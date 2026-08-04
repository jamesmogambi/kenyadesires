// store/fileStore.ts
import { create } from "zustand";

interface FileStore {
  existingImages: string[];
  files: File[];

  existingVideos: string[];
  videoFiles: File[];

  setExistingImages: (urls: string[]) => void;
  addFiles: (files: File[]) => void;
  removeExistingImage: (url: string) => void;
  removeFile: (index: number) => void;

  setExistingVideos: (urls: string[]) => void;
  addVideoFiles: (files: File[]) => void;
  removeVideoFile: (index: number) => void;
  removeExistingVideo: (playbackId: string) => void;

  clearFiles: () => void;
  clearVideoFiles: () => void;
}

export const useFileStore = create<FileStore>((set) => ({
  existingImages: [],
  files: [],

  existingVideos: [],
  videoFiles: [],

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

  setExistingVideos: (urls) => set({ existingVideos: urls }),

  addVideoFiles: (newFiles) =>
    set((state) => ({
      videoFiles: [...state.videoFiles, ...newFiles],
    })),

  removeVideoFile: (index) =>
    set((state) => ({
      videoFiles: state.videoFiles.filter((_, i) => i !== index),
    })),

  removeExistingVideo: (playbackId) =>
    set((state) => ({
      existingVideos: state.existingVideos.filter((v) => v !== playbackId),
    })),

  clearFiles: () =>
    set({
      files: [],
      existingImages: [],
    }),

  clearVideoFiles: () =>
    set({
      videoFiles: [],
      existingVideos: [],
    }),
}));

import { create } from "zustand";
import type { Artboard, ArtboardPresetId } from "../types/projectTypes";

const presets: Artboard[] = [
  {
    id: "A4_PORTRAIT",
    name: "A4 portrait",
    width: 794,
    height: 1123,
    unit: "px",
    backgroundColor: "#ffffff",
  },
  {
    id: "A4_LANDSCAPE",
    name: "A4 landscape",
    width: 1123,
    height: 794,
    unit: "px",
    backgroundColor: "#ffffff",
  },
  {
    id: "SQUARE",
    name: "Square",
    width: 1080,
    height: 1080,
    unit: "px",
    backgroundColor: "#ffffff",
  },
  {
    id: "TIKTOK_9_16",
    name: "TikTok 9:16",
    width: 1080,
    height: 1920,
    unit: "px",
    backgroundColor: "#ffffff",
  },
  {
    id: "CUSTOM",
    name: "Custom",
    width: 1200,
    height: 800,
    unit: "px",
    backgroundColor: "#ffffff",
  },
];

type AppStore = {
  activePanel: "Properties" | "Templates" | "Symbols" | "Guides" | "Shapes" | "Text" | "Groups" | "Export";
  artboard: Artboard;
  preset: ArtboardPresetId;
  presets: Artboard[];
  projectName: string;
  saveStatus: "saved" | "saving";
  setActivePanel: (panel: AppStore["activePanel"]) => void;
  setArtboard: (artboard: Artboard) => void;
  setProjectName: (name: string) => void;
  setSaveStatus: (status: AppStore["saveStatus"]) => void;
  setPreset: (preset: string) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  activePanel: "Properties",
  artboard: presets[0],
  preset: "A4_PORTRAIT",
  presets,
  projectName: "Untitled pattern",
  saveStatus: "saved",
  setActivePanel: (activePanel) => set({ activePanel }),
  setArtboard: (artboard) => set({ artboard, preset: artboard.id }),
  setProjectName: (projectName) => set({ projectName: projectName || "Untitled pattern" }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setPreset: (preset) => {
    const nextArtboard = presets.find((item) => item.id === preset);

    if (!nextArtboard) {
      return;
    }

    set({
      artboard: nextArtboard,
      preset: nextArtboard.id,
    });
  },
}));

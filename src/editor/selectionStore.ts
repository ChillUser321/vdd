import { create } from "zustand";
import type { AppState } from "@excalidraw/excalidraw/types";
import type {
  ExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/excalidraw/element/types";

type SelectionStore = {
  selectedElement: ExcalidrawElement | null;
  selectedElementAngle: number;
  clearSelection: () => void;
  syncSelection: (
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
  ) => void;
};

export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedElement: null,
  selectedElementAngle: 0,
  clearSelection: () => set({ selectedElement: null, selectedElementAngle: 0 }),
  syncSelection: (elements, appState) => {
    const selectedId = Object.keys(appState.selectedElementIds).find(
      (id) => appState.selectedElementIds[id],
    );
    const selectedElement =
      elements.find((element) => element.id === selectedId && !element.isDeleted) ?? null;

    // Track angle separately because Excalidraw may retain the element reference while
    // its native rotation handle is moving.
    set({ selectedElement, selectedElementAngle: selectedElement?.angle ?? 0 });
  },
}));

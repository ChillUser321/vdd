import { create } from "zustand";

export type CrochetGroup = {
  id: string;
  name: string;
  excalidrawElementIds: string[];
  visible?: boolean;
  locked?: boolean;
  exportSettings: {
    format: "png" | "svg" | "webm" | "gif" | "apng";
    includeGuides: boolean;
    transparentBackground: boolean;
    padding: number;
  };
  effect?: {
    type: "none" | "blink" | "pulse-opacity" | "highlight-outline";
    durationMs: number;
    loop: boolean;
    opacityFrom?: number;
    opacityTo?: number;
  };
};

type GroupStore = {
  groups: CrochetGroup[];
  selectedGroupId: string | null;
  addGroup: (name: string, elementIds: string[]) => string;
  removeGroup: (id: string) => void;
  replaceGroups: (groups: CrochetGroup[]) => void;
  selectGroup: (id: string | null) => void;
  syncFromElements: (
    elements: readonly { id: string; isDeleted?: boolean; groupIds: readonly string[] }[],
    selectedNativeGroupId: string | null,
  ) => void;
  updateGroup: (id: string, patch: Partial<CrochetGroup>) => void;
};

function defaultExportSettings(): CrochetGroup["exportSettings"] {
  return { format: "png", includeGuides: false, transparentBackground: false, padding: 16 };
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export const useGroupStore = create<GroupStore>((set) => ({
  groups: [],
  selectedGroupId: null,
  addGroup: (name, excalidrawElementIds) => {
    const id = `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set(({ groups }) => ({
      groups: [...groups, {
        id,
        name,
        excalidrawElementIds,
        visible: true,
        locked: false,
        exportSettings: defaultExportSettings(),
      }],
      selectedGroupId: id,
    }));
    return id;
  },
  removeGroup: (id) => set(({ groups, selectedGroupId }) => ({
    groups: groups.filter((group) => group.id !== id),
    selectedGroupId: selectedGroupId === id ? null : selectedGroupId,
  })),
  replaceGroups: (groups) => set({ groups, selectedGroupId: groups[0]?.id ?? null }),
  selectGroup: (selectedGroupId) => set({ selectedGroupId }),
  syncFromElements: (elements, selectedNativeGroupId) => set(({ groups, selectedGroupId }) => {
    const nativeGroups = new Map<string, string[]>();
    for (const element of elements) {
      if (element.isDeleted) continue;
      for (const groupId of element.groupIds) {
        const ids = nativeGroups.get(groupId) ?? [];
        ids.push(element.id);
        nativeGroups.set(groupId, ids);
      }
    }

    let nextGroupNumber = groups.length + 1;
    const nextGroups = [...nativeGroups.entries()].map(([id, excalidrawElementIds]) => {
      const existing = groups.find((group) => group.id === id);
      return existing
        ? (sameIds(existing.excalidrawElementIds, excalidrawElementIds)
          ? existing
          : { ...existing, excalidrawElementIds })
        : {
            id,
            name: `Group ${nextGroupNumber++}`,
            excalidrawElementIds,
            visible: true,
            locked: false,
            exportSettings: defaultExportSettings(),
          };
    });
    const nextSelectedGroupId = selectedNativeGroupId && nativeGroups.has(selectedNativeGroupId)
      ? selectedNativeGroupId
      : (selectedGroupId && nativeGroups.has(selectedGroupId) ? selectedGroupId : null);
    const unchanged = groups.length === nextGroups.length && groups.every((group, index) => group === nextGroups[index]);
    if (unchanged && selectedGroupId === nextSelectedGroupId) return { groups, selectedGroupId };
    return { groups: nextGroups, selectedGroupId: nextSelectedGroupId };
  }),
  updateGroup: (id, patch) => set(({ groups }) => ({
    groups: groups.map((group) => group.id === id ? { ...group, ...patch } : group),
  })),
}));

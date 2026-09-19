import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { getExcalidrawApi } from "../editor/excalidrawApi";
import { useSelectionStore } from "../editor/selectionStore";
import { useGroupStore } from "../groups/groupStore";
import { useGuideStore } from "../guides/guideStore";
import { isCrochetProject, type CrochetProject } from "../types/projectTypes";
import { useAppStore } from "./appStore";

const STORAGE_KEY = "violet-drizzle-project-v1";
let timer: number | undefined;

function getStorageKey() {
  const pageId = new URLSearchParams(window.location.search).get("page");
  return pageId ? `${STORAGE_KEY}:${pageId}` : STORAGE_KEY;
}

function normalizeProjectGroups(project: CrochetProject): CrochetProject {
  if (!project.groups.length) return project;
  const groupIdsByElement = new Map<string, string[]>();
  for (const group of project.groups) {
    for (const elementId of group.excalidrawElementIds) {
      const groupIds = groupIdsByElement.get(elementId) ?? [];
      groupIds.push(group.id);
      groupIdsByElement.set(elementId, groupIds);
    }
  }
  let changed = false;
  const elements = project.excalidraw.elements.map((value) => {
    if (!value || typeof value !== "object" || !("id" in value) || typeof value.id !== "string") {
      return value;
    }
    const requiredGroupIds = groupIdsByElement.get(value.id) ?? [];
    if (!requiredGroupIds.length) return value;
    const existingGroupIds = "groupIds" in value && Array.isArray(value.groupIds)
      ? value.groupIds.filter((id): id is string => typeof id === "string")
      : [];
    const groupIds = [...existingGroupIds, ...requiredGroupIds.filter((id) => !existingGroupIds.includes(id))];
    if (groupIds.length === existingGroupIds.length) return value;
    changed = true;
    return { ...value, groupIds };
  });
  return changed ? { ...project, excalidraw: { ...project.excalidraw, elements } } : project;
}

export function readAutosave(): CrochetProject | null {
  try {
    const raw = localStorage.getItem(getStorageKey());
    const value: unknown = raw ? JSON.parse(raw) : null;
    return isCrochetProject(value) ? normalizeProjectGroups(value) : null;
  } catch { return null; }
}

export function buildProject(api: ExcalidrawImperativeAPI = getExcalidrawApi()!): CrochetProject {
  const app = useAppStore.getState();
  const editorState = api.getAppState();
  const previous = readAutosave();
  const now = new Date().toISOString();
  return {
    version: 1,
    name: app.projectName,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    artboard: app.artboard,
    excalidraw: {
      elements: [...api.getSceneElementsIncludingDeleted()],
      appState: {
        currentItemBackgroundColor: editorState.currentItemBackgroundColor,
        currentItemFillStyle: editorState.currentItemFillStyle,
        currentItemFontFamily: editorState.currentItemFontFamily,
        currentItemFontSize: editorState.currentItemFontSize,
        currentItemRoughness: editorState.currentItemRoughness,
        currentItemStrokeColor: editorState.currentItemStrokeColor,
        currentItemStrokeStyle: editorState.currentItemStrokeStyle,
        currentItemStrokeWidth: editorState.currentItemStrokeWidth,
        name: editorState.name,
        scrollX: editorState.scrollX,
        scrollY: editorState.scrollY,
        viewBackgroundColor: editorState.viewBackgroundColor,
        zoom: editorState.zoom,
      },
      files: api.getFiles() as unknown as Record<string, unknown>,
    },
    guides: useGuideStore.getState().guides,
    groups: useGroupStore.getState().groups,
    metadata: {},
  };
}

export function applyProject(project: CrochetProject, api = getExcalidrawApi()) {
  project = normalizeProjectGroups(project);
  window.clearTimeout(timer);
  timer = undefined;
  useAppStore.getState().setProjectName(project.name);
  useAppStore.getState().setArtboard(project.artboard);
  useGuideStore.getState().replaceGuides(project.guides);
  useGroupStore.getState().replaceGroups(project.groups);
  useSelectionStore.getState().clearSelection();
  if (api && project.excalidraw.files) {
    api.addFiles(Object.values(project.excalidraw.files) as BinaryFiles[string][]);
  }
  api?.updateScene({
    elements: project.excalidraw.elements as ExcalidrawElement[],
    appState: {
      ...api.getAppState(),
      ...project.excalidraw.appState,
      selectedElementIds: {},
    } as AppState,
  });
  localStorage.setItem(getStorageKey(), JSON.stringify(project));
  useAppStore.getState().setSaveStatus("saved");
}

export function scheduleAutosave() {
  const api = getExcalidrawApi();
  if (!api) return;
  useAppStore.getState().setSaveStatus("saving");
  window.clearTimeout(timer);
  timer = window.setTimeout(flushAutosave, 350);
}

export function flushAutosave() {
  const api = getExcalidrawApi();
  if (!api) return;
  window.clearTimeout(timer);
  timer = undefined;
  localStorage.setItem(getStorageKey(), JSON.stringify(buildProject(api)));
  useAppStore.getState().setSaveStatus("saved");
}

export function downloadProject() {
  const api = getExcalidrawApi();
  if (!api) return;
  const project = buildProject(api);
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${project.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "pattern"}.crochet.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importProject(file: File) {
  let value: unknown;
  try {
    value = JSON.parse(await file.text());
  } catch {
    throw new Error("That file is not readable JSON.");
  }
  if (!isCrochetProject(value)) throw new Error("This is not a valid Violet Drizzle project file.");
  applyProject(value);
}

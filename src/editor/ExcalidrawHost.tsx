import { CaptureUpdateAction, Excalidraw } from "@excalidraw/excalidraw";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useAppStore } from "../state/appStore";
import { GuideFloatingPanel } from "../guides/GuideFloatingPanel";
import { GuideOverlay } from "../guides/GuideOverlay";
import { useGuideStore } from "../guides/guideStore";
import { getActiveSquareSnapGuide, snapObjectElementsToGuide } from "../guides/snapToGuides";
import { useSelectionStore } from "./selectionStore";
import { ArtboardOverlay } from "./ArtboardOverlay";
import {
  centerArtboardViewport,
  getArtboardViewport,
  type ArtboardViewport,
} from "./artboardViewport";
import { setExcalidrawApi } from "./excalidrawApi";
import { SymbolFloatingPanel } from "./SymbolFloatingPanel";
import { readAutosave, scheduleAutosave } from "../state/projectPersistence";
import { useGroupStore } from "../groups/groupStore";

export function ExcalidrawHost() {
  const artboard = useAppStore((state) => state.artboard);
  const guides = useGuideStore((state) => state.guides);
  const syncSelection = useSelectionStore((state) => state.syncSelection);
  const syncGroupsFromElements = useGroupStore((state) => state.syncFromElements);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [viewport, setViewport] = useState<ArtboardViewport | null>(null);
  const snapUpdateInProgress = useRef(false);
  const activeSnapGuide = useMemo(() => getActiveSquareSnapGuide(guides), [guides]);
  const restoredProject = useMemo(() => readAutosave(), []);
  const initialData = useMemo(
    () => ({
      elements: restoredProject?.excalidraw.elements as never[] | undefined,
      files: restoredProject?.excalidraw.files as never,
      appState: {
        ...(restoredProject?.excalidraw.appState ?? {}),
        viewBackgroundColor: "transparent",
        currentItemRoughness: 0,
        currentItemStrokeColor: "#172033",
      },
    }),
    [restoredProject],
  );

  const handleApi = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawApi(api);
    setApi(api);
  }, []);

  const updateViewport = useCallback((api: ExcalidrawImperativeAPI) => {
    setViewport(getArtboardViewport(api));
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      centerArtboardViewport(api, artboard);
      updateViewport(api);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [api, artboard, updateViewport]);

  useEffect(() => {
    if (!restoredProject) return;
    useAppStore.getState().setProjectName(restoredProject.name);
    useAppStore.getState().setArtboard(restoredProject.artboard);
    useGuideStore.getState().replaceGuides(restoredProject.guides);
    useGroupStore.getState().replaceGroups(restoredProject.groups);
  }, [restoredProject]);

  const snapSceneToGuide = useCallback(() => {
    if (!api || snapUpdateInProgress.current) {
      return;
    }

    const { changed, elements } = snapObjectElementsToGuide(
      api.getSceneElementsIncludingDeleted(),
      activeSnapGuide,
    );

    if (!changed) {
      return;
    }

    snapUpdateInProgress.current = true;
    api.updateScene({
      elements,
      captureUpdate: CaptureUpdateAction.EVENTUALLY,
    });
    window.requestAnimationFrame(() => {
      snapUpdateInProgress.current = false;
    });
  }, [activeSnapGuide, api]);

  useEffect(() => {
    snapSceneToGuide();
  }, [snapSceneToGuide]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-200">
      <ArtboardOverlay artboard={artboard} viewport={viewport} />
      <GuideOverlay artboard={artboard} viewport={viewport} />
      <div className="absolute inset-0">
        <Excalidraw
          excalidrawAPI={handleApi}
          initialData={initialData}
          onChange={(elements, appState) => {
            syncSelection(elements, appState);
            const selectedNativeGroupId = Object.keys(appState.selectedGroupIds ?? {}).find(
              (id) => appState.selectedGroupIds?.[id],
            ) ?? null;
            syncGroupsFromElements(elements, selectedNativeGroupId);
            snapSceneToGuide();
            scheduleAutosave();
          }}
          onScrollChange={() => {
            if (api) {
              updateViewport(api);
            }
          }}
        />
      </div>
      <GuideFloatingPanel />
      <SymbolFloatingPanel />
    </div>
  );
}

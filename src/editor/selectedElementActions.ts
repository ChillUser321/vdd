import { CaptureUpdateAction, newElementWith } from "@excalidraw/excalidraw";
import type { BinaryFileData } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { FileId } from "@excalidraw/excalidraw/element/types";
import { crochetSymbols } from "../symbols/crochetSymbols";
import { createSymbolFile, createSymbolFileId } from "./symbolInsertion";
import { getExcalidrawApi } from "./excalidrawApi";
import { useSelectionStore } from "./selectionStore";

function randomInteger() {
  return Math.floor(Math.random() * 2 ** 31);
}

function createElementId() {
  return `vdd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function updateElement(
  elementId: string,
  updates: Partial<ExcalidrawElement>,
  files: BinaryFileData[] = [],
) {
  const api = getExcalidrawApi();

  if (!api) {
    return;
  }

  const elements = api.getSceneElementsIncludingDeleted();
  const nextElements = elements.map((element) =>
    element.id === elementId ? newElementWith(element, updates as any) : element,
  );

  if (files.length > 0) {
    api.addFiles(files);
  }

  api.updateScene({
    elements: nextElements,
    appState: {
      selectedElementIds: {
        [elementId]: true,
      },
    },
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
}

export function updateSelectedElementOpacity(element: ExcalidrawElement, opacity: number) {
  updateElement(element.id, {
    opacity: Math.min(100, Math.max(0, Math.round(opacity))),
  });
}

export function updateSelectedElementAngle(element: ExcalidrawElement, degrees: number) {
  const normalizedDegrees = Math.min(180, Math.max(-180, degrees));
  updateElement(element.id, {
    angle: (normalizedDegrees * Math.PI) / 180,
  });
}

export function updateSelectedSymbolColor(element: ExcalidrawElement, color: string) {
  const symbolId = element.customData?.symbolId;
  const symbol = crochetSymbols.find((item) => item.id === symbolId);

  if (!symbol) {
    return;
  }

  const fileId = createSymbolFileId(symbol) as FileId;
  const file = createSymbolFile(symbol, color, fileId);

  updateElement(
    element.id,
    {
      fileId,
      customData: {
        ...element.customData,
        symbolColor: color,
      },
    },
    [file],
  );
}

export function deleteSelectedElement(element: ExcalidrawElement) {
  const api = getExcalidrawApi();

  if (!api) {
    return;
  }

  const elements = api.getSceneElementsIncludingDeleted();
  const nextElements = elements.map((sceneElement) =>
    sceneElement.id === element.id
      ? newElementWith(sceneElement, { isDeleted: true })
      : sceneElement,
  );

  api.updateScene({
    elements: nextElements,
    appState: {
      selectedElementIds: {},
    },
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
}

export function clearSelectedElements() {
  const api = getExcalidrawApi();

  useSelectionStore.getState().clearSelection();

  if (!api) {
    return;
  }

  api.updateScene({
    appState: {
      selectedElementIds: {},
    },
    captureUpdate: CaptureUpdateAction.EVENTUALLY,
  });
}

export function duplicateSelectedElement(element: ExcalidrawElement) {
  const api = getExcalidrawApi();

  if (!api) {
    return;
  }

  const duplicate = {
    ...element,
    id: createElementId(),
    x: element.x + 32,
    y: element.y + 32,
    seed: randomInteger(),
    version: 1,
    versionNonce: randomInteger(),
    updated: Date.now(),
    index: null,
    isDeleted: false,
  } as ExcalidrawElement;

  api.updateScene({
    elements: [...api.getSceneElementsIncludingDeleted(), duplicate],
    appState: {
      selectedElementIds: {
        [duplicate.id]: true,
      },
    },
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
}

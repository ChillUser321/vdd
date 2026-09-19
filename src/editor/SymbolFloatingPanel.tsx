import {
  deleteSelectedElement,
  duplicateSelectedElement,
  updateSelectedElementAngle,
  updateSelectedElementOpacity,
  updateSelectedSymbolColor,
} from "./selectedElementActions";
import { getFloatingPanelKind, isSelectedSymbol } from "./floatingPanels";
import { useAppStore } from "../state/appStore";
import { useSelectionStore } from "./selectionStore";
import { DEFAULT_SYMBOL_COLOR } from "./symbolInsertion";

const symbolSwatches = ["#172033", "#dc2626", "#16a34a", "#2563eb", "#f59e0b", "#7c3aed"];

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 8h10v10H8zM6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 8v11M12 8v11M16 8v11M5 6h14M10 4h4M7 6l1 15h8l1-15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function SymbolFloatingPanel() {
  const activePanel = useAppStore((state) => state.activePanel);
  const selectedElement = useSelectionStore((state) => state.selectedElement);
  const selectedElementAngle = useSelectionStore((state) => state.selectedElementAngle);
  const floatingPanelKind = getFloatingPanelKind(activePanel, selectedElement);

  if (floatingPanelKind !== "stitch" || !isSelectedSymbol(selectedElement)) {
    return null;
  }

  const color =
    typeof selectedElement.customData?.symbolColor === "string"
      ? selectedElement.customData.symbolColor
      : DEFAULT_SYMBOL_COLOR;
  const angle = Math.round((selectedElementAngle * 180) / Math.PI);

  return (
    <div
      aria-label="Stitch controls"
      className="vdd-symbol-floating-panel absolute left-4 top-20 z-30 w-64 rounded-lg border border-slate-200 bg-white p-3 text-slate-900 shadow-xl"
      onPointerDown={(event) => event.stopPropagation()}
      role="region"
    >
      <div className="space-y-4">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stitch</h2>
          <div className="flex items-center gap-2">
            <button
              aria-label="Duplicate stitch"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-teal-500 hover:text-teal-800"
              onClick={() => duplicateSelectedElement(selectedElement)}
              title="Duplicate stitch"
              type="button"
            >
              <CopyIcon />
            </button>
            <button
              aria-label="Delete stitch"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-white text-red-700 transition hover:border-red-300 hover:bg-red-50"
              onClick={() => deleteSelectedElement(selectedElement)}
              title="Delete stitch"
              type="button"
            >
              <TrashIcon />
            </button>
          </div>
        </header>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stroke</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {symbolSwatches.map((swatch) => (
              <button
                aria-label={`Set stitch color ${swatch}`}
                className={`h-8 w-8 rounded-md border ${
                  color === swatch ? "border-teal-600 ring-2 ring-teal-100" : "border-slate-200"
                }`}
                key={swatch}
                onClick={() => updateSelectedSymbolColor(selectedElement, swatch)}
                style={{ backgroundColor: swatch }}
                type="button"
              />
            ))}
            <input
              aria-label="Custom stitch color"
              className="h-8 w-10 rounded-md border border-slate-200 bg-white p-1"
              onChange={(event) => updateSelectedSymbolColor(selectedElement, event.target.value)}
              type="color"
              value={color}
            />
          </div>
        </section>

        <label className="grid gap-2 text-xs font-medium text-slate-600">
          <span className="flex items-center justify-between">
            <span>Angle</span>
            <span className="text-slate-500">{angle}°</span>
          </span>
          <div className="grid grid-cols-[1fr_64px] items-center gap-2">
            <input
              aria-label="Stitch angle"
              max={180}
              min={-180}
              onChange={(event) =>
                updateSelectedElementAngle(selectedElement, Number(event.target.value))
              }
              step={1}
              type="range"
              value={angle}
            />
            <input
              aria-label="Stitch angle degrees"
              className="h-8 rounded-md border border-slate-300 px-2 text-sm"
              max={180}
              min={-180}
              onChange={(event) =>
                updateSelectedElementAngle(selectedElement, Number(event.target.value))
              }
              type="number"
              value={angle}
            />
          </div>
        </label>

        <label className="grid gap-2 text-xs font-medium text-slate-600">
          <span className="flex items-center justify-between">
            <span>Opacity</span>
            <span className="text-slate-500">{selectedElement.opacity}%</span>
          </span>
          <input
            aria-label="Stitch opacity"
            max={100}
            min={0}
            onChange={(event) =>
              updateSelectedElementOpacity(selectedElement, Number(event.target.value))
            }
            type="range"
            value={selectedElement.opacity}
          />
        </label>
      </div>
    </div>
  );
}

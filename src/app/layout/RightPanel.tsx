import { useAppStore } from "../../state/appStore";
import { useSelectionStore } from "../../editor/selectionStore";
import { useGuideStore } from "../../guides/guideStore";
import { useGroupStore } from "../../groups/groupStore";

export function RightPanel() {
  const artboard = useAppStore((state) => state.artboard);
  const activePanel = useAppStore((state) => state.activePanel);
  const selectedElement = useSelectionStore((state) => state.selectedElement);
  const selectedGuideId = useGuideStore((state) => state.selectedGuideId);
  const selectedGuide = useGuideStore((state) => state.guides.find((guide) => guide.id === selectedGuideId));
  const selectedGroupId = useGroupStore((state) => state.selectedGroupId);
  const selectedGroup = useGroupStore((state) => state.groups.find((group) => group.id === selectedGroupId));

  return (
    <aside aria-label="Properties panel" className="hidden min-h-0 overflow-y-auto border-l border-slate-200 bg-white p-4 lg:block">
      <div className="space-y-4">
        <section>
          <h2 className="text-sm font-semibold text-slate-900">Properties</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <dt className="text-slate-500">Artboard</dt>
            <dd className="text-right font-medium text-slate-800">{artboard.name}</dd>
            <dt className="text-slate-500">Width</dt>
            <dd className="text-right font-medium text-slate-800">
              {artboard.width} {artboard.unit}
            </dd>
            <dt className="text-slate-500">Height</dt>
            <dd className="text-right font-medium text-slate-800">
              {artboard.height} {artboard.unit}
            </dd>
          </dl>
        </section>

        <section className="border-t border-slate-200 pt-4"><h2 className="text-sm font-semibold text-slate-900">Current selection</h2><div className="mt-3 space-y-2 text-xs text-slate-600">
          {selectedElement ? <><p className="font-medium text-slate-900">Canvas object</p><p>Type: {selectedElement.type}</p><p>Size: {Math.round(selectedElement.width)} × {Math.round(selectedElement.height)} px</p></> : activePanel === "Guides" && selectedGuide ? <><p className="font-medium text-slate-900">{selectedGuide.name}</p><p>Guide: {selectedGuide.type}</p><p>{selectedGuide.visible ? "Visible" : "Hidden"} · {selectedGuide.locked ? "Locked" : "Unlocked"}</p></> : activePanel === "Groups" && selectedGroup ? <><p className="font-medium text-slate-900">{selectedGroup.name}</p><p>{selectedGroup.excalidrawElementIds.length} objects</p></> : <p>Select an object, guide, or group to see its details.</p>}
        </div></section>
      </div>
    </aside>
  );
}

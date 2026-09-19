import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import { getExcalidrawApi } from "../editor/excalidrawApi";
import { useGroupStore } from "./groupStore";

export function GroupPanel() {
  const groups = useGroupStore((state) => state.groups);
  const selectedGroupId = useGroupStore((state) => state.selectedGroupId);
  const addGroup = useGroupStore((state) => state.addGroup);
  const removeGroup = useGroupStore((state) => state.removeGroup);
  const selectGroup = useGroupStore((state) => state.selectGroup);
  const updateGroup = useGroupStore((state) => state.updateGroup);

  const createFromSelection = () => {
    const api = getExcalidrawApi();
    if (!api) return;
    const selectedIds = Object.keys(api.getAppState().selectedElementIds).filter(
      (id) => api.getAppState().selectedElementIds[id],
    );
    if (selectedIds.length < 2) {
      api.setToast({ message: "Select at least two objects to create a group" });
      return;
    }
    const id = addGroup(`Group ${groups.length + 1}`, selectedIds);
    api.updateScene({
      elements: api.getSceneElementsIncludingDeleted().map((element) =>
        selectedIds.includes(element.id)
          ? {
              ...element,
              groupIds: [...element.groupIds, id],
              version: element.version + 1,
              versionNonce: Math.floor(Math.random() * 2_000_000_000),
            }
          : element,
      ),
      appState: {
        selectedElementIds: Object.fromEntries(selectedIds.map((elementId) => [elementId, true])),
        selectedGroupIds: { [id]: true },
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
  };
  const applyGroup = (id: string, patch: { visible?: boolean; locked?: boolean }) => {
    const group = groups.find((item) => item.id === id);
    const api = getExcalidrawApi();
    if (!group || !api) return;
    api.updateScene({ elements: api.getSceneElementsIncludingDeleted().map((element) => {
      if (!group.excalidrawElementIds.includes(element.id)) return element;
      const previousOpacity = Number(element.customData?.vddPreviousOpacity ?? 100);
      return { ...element,
        ...(patch.locked === undefined ? {} : { locked: patch.locked }),
        ...(patch.visible === undefined ? {} : { opacity: patch.visible ? previousOpacity : 0 }),
        customData: { ...element.customData, ...(patch.visible === false ? { vddPreviousOpacity: element.opacity } : {}) },
        version: element.version + 1, versionNonce: Math.floor(Math.random() * 2_000_000_000),
      };
    }), captureUpdate: CaptureUpdateAction.IMMEDIATELY });
    updateGroup(id, patch);
  };
  const selectOnCanvas = (id: string) => {
    const group = groups.find((item) => item.id === id);
    const api = getExcalidrawApi();
    if (!group || !api) return;
    selectGroup(id);
    api.updateScene({ appState: {
      selectedElementIds: Object.fromEntries(group.excalidrawElementIds.map((elementId) => [elementId, true])),
      selectedGroupIds: { [id]: true },
    } });
  };
  const ungroup = (id: string) => {
    const group = groups.find((item) => item.id === id);
    const api = getExcalidrawApi();
    if (!group || !api) return;
    api.updateScene({
      elements: api.getSceneElementsIncludingDeleted().map((element) =>
        element.groupIds.includes(id)
          ? {
              ...element,
              groupIds: element.groupIds.filter((groupId) => groupId !== id),
              version: element.version + 1,
              versionNonce: Math.floor(Math.random() * 2_000_000_000),
            }
          : element,
      ),
      appState: {
        selectedElementIds: Object.fromEntries(group.excalidrawElementIds.map((elementId) => [elementId, true])),
        selectedGroupIds: {},
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    removeGroup(id);
  };

  return <div className="space-y-4 p-4">
    <div><h2 className="text-base font-semibold">Groups</h2><p className="text-xs text-slate-500">Canvas groups appear here automatically, including groups made from the right-click menu.</p></div>
    <button className="vdd-primary-button w-full" onClick={createFromSelection} type="button">Create from selected objects</button>
    {!groups.length ? <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">Select one or more objects on the canvas, then create a group.</p> : null}
    {groups.map((group) => <section className={`space-y-2 rounded-lg border p-3 ${selectedGroupId === group.id ? "border-teal-500 bg-teal-50" : "border-slate-200"}`} key={group.id}>
      <input aria-label={`Group name ${group.name}`} className="vdd-field w-full" value={group.name} onChange={(event) => updateGroup(group.id, { name: event.target.value })} />
      <p className="text-[11px] text-slate-500">{group.excalidrawElementIds.length} object{group.excalidrawElementIds.length === 1 ? "" : "s"}</p>
      <div className="grid grid-cols-2 gap-2">
        <button className="vdd-button" onClick={() => selectOnCanvas(group.id)} type="button">Select</button>
        <button className="vdd-button" onClick={() => applyGroup(group.id, { visible: !group.visible })} type="button">{group.visible === false ? "Show" : "Hide"}</button>
        <button className="vdd-button" onClick={() => applyGroup(group.id, { locked: !group.locked })} type="button">{group.locked ? "Unlock" : "Lock"}</button>
        <button className="vdd-button text-red-700" onClick={() => ungroup(group.id)} type="button">Ungroup</button>
      </div>
    </section>)}
  </div>;
}

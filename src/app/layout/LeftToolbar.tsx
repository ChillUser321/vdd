import { clearSelectedElements } from "../../editor/selectedElementActions";
import { useAppStore } from "../../state/appStore";
import { getExcalidrawApi } from "../../editor/excalidrawApi";

const tools = ["Templates", "Symbols", "Guides", "Shapes", "Text", "Groups", "Export"] as const;
type ToolName = (typeof tools)[number];

export function LeftToolbar() {
  const activePanel = useAppStore((state) => state.activePanel);
  const setActivePanel = useAppStore((state) => state.setActivePanel);

  return (
    <aside className="flex min-h-0 flex-col items-center gap-2 border-r border-slate-200 bg-white px-2 py-3">
      {tools.map((tool) => (
        <button
          className={`flex h-12 w-full items-center justify-center rounded-md text-[11px] font-medium transition ${
            activePanel === tool
              ? "bg-teal-50 text-teal-800"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
          key={tool}
          onClick={() => {
            const nextPanel = activePanel === tool ? "Properties" : (tool as ToolName);

            if (nextPanel === "Guides") {
              clearSelectedElements();
            }

            if (nextPanel === "Shapes") getExcalidrawApi()?.setActiveTool({ type: "rectangle" });
            if (nextPanel === "Text") getExcalidrawApi()?.setActiveTool({ type: "text" });

            setActivePanel(nextPanel);
          }}
          type="button"
          aria-pressed={activePanel === tool}
        >
          {tool}
        </button>
      ))}
    </aside>
  );
}

import { clearSelectedElements } from "../editor/selectedElementActions";
import { useGuideStore } from "./guideStore";

export function GuidePanel() {
  const guides = useGuideStore((state) => state.guides);
  const selectedGuideId = useGuideStore((state) => state.selectedGuideId);
  const addGuide = useGuideStore((state) => state.addGuide);
  const selectGuide = useGuideStore((state) => state.selectGuide);
  const selectedGuide = guides.find((guide) => guide.id === selectedGuideId) ?? guides[0];

  const addGuideLayer = (type: Parameters<typeof addGuide>[0]) => {
    clearSelectedElements();
    addGuide(type);
  };

  const selectGuideLayer = (id: string) => {
    clearSelectedElements();
    selectGuide(id);
  };

  if (!selectedGuide) {
    return null;
  }

  return (
    <div className="space-y-5 p-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Guides</h2>
        <p className="text-xs font-medium text-slate-500">Editor overlays, not drawing objects</p>
      </div>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-800"
            onClick={() => addGuideLayer("square-grid")}
            type="button"
          >
            Grid
          </button>
          <button
            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-800"
            onClick={() => addGuideLayer("polar-grid")}
            type="button"
          >
            Polar
          </button>
          <button
            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-800"
            onClick={() => addGuideLayer("half-polar-grid")}
            type="button"
          >
            Half polar
          </button>
          <button
            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-800"
            onClick={() => addGuideLayer("quarter-polar-grid")}
            type="button"
          >
            Quarter polar
          </button>
          <button className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-500" onClick={() => addGuideLayer("radial-guide")} type="button">Radial</button>
          <button className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-500" onClick={() => addGuideLayer("custom-svg-guide")} type="button">Custom SVG</button>
        </div>
      </section>

      <div className="space-y-2">
        {guides.map((guide) => (
          <button
            className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
              guide.id === selectedGuide.id
                ? "border-teal-500 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
            key={guide.id}
            onClick={() => selectGuideLayer(guide.id)}
            type="button"
          >
            <span>
              <span className="block font-semibold">{guide.name}</span>
              <span className="text-xs text-slate-500">{guide.type}</span>
            </span>
            <span className="text-right text-xs text-slate-500">
              <span className="block">{guide.visible ? "Shown" : "Hidden"}</span>
              {guide.type === "square-grid" ? (
                <span className={guide.snapEnabled ? "font-semibold text-teal-700" : ""}>
                  Snap {guide.snapEnabled ? "on" : "off"}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

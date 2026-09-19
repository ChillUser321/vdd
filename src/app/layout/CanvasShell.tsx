import { ExcalidrawHost } from "../../editor/ExcalidrawHost";

export function CanvasShell() {
  return (
    <section className="relative min-h-0 overflow-hidden bg-slate-200">
      <div className="h-full min-h-0">
        <ExcalidrawHost />
      </div>
    </section>
  );
}

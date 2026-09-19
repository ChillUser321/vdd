import type { TemplateSummary } from "./templateTypes";

export async function loadTemplateManifest(): Promise<TemplateSummary[]> {
  const response = await fetch(new URL("templates/manifest.json", document.baseURI));
  if (!response.ok) throw new Error("Template gallery could not be loaded.");
  return response.json() as Promise<TemplateSummary[]>;
}

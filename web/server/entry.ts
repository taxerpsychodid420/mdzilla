import "#nitro/virtual/polyfills";
import type { DocsSource } from "mdzilla";
import { useNitroApp } from "nitro/app";
import { useDocs } from "./docs";

export async function createDocsServer(initOpts: { source: DocsSource }) {
  const nitroApp = useNitroApp();
  const docs = await useDocs(initOpts);
  return {
    fetch: nitroApp.fetch,
    docs,
  };
}

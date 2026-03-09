import type { DocsManager, DocsSource } from "mdzilla";

let _docs: DocsManager;

export async function useDocs(initOpts?: { source: DocsSource }): Promise<DocsManager> {
  if (_docs) return _docs;
  if (!_docs) {
    const { DocsManager, DocsSourceGit } = await import("mdzilla");
    _docs = new DocsManager(
      initOpts?.source || new DocsSourceGit("gh:nitrojs/nitro/docs", { subdir: "docs" }),
    );
    await _docs.load();
  }
  return _docs;
}

import { defineHandler, getQuery } from "nitro/h3";
import { init, renderToHtml } from "md4x/napi";
import { highlightText, type ShjLanguage } from "@speed-highlight/core";
import { useDocs } from "../docs.ts";

await init();

export default defineHandler(async (event) => {
  const { path } = getQuery<{ path?: string }>(event);
  if (!path) {
    return { error: "Missing ?path= query parameter" };
  }
  const docs = await useDocs();
  const result = await docs.resolvePage(path);
  if (!result.raw) {
    return { error: "Page not found", path };
  }
  const html = addHeadingAnchors(await highlightCodeBlocks(renderToHtml(result.raw)));
  return { path, html };
});

async function highlightCodeBlocks(html: string): Promise<string> {
  const codeBlockRe = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
  const replacements: Promise<{ match: string; result: string }>[] = [];
  for (const m of html.matchAll(codeBlockRe)) {
    const [match, lang, encoded] = m as RegExpExecArray & [string, string, string];
    const text = decodeHtmlEntities(encoded);
    replacements.push(
      highlightText(text, lang as ShjLanguage, false)
        .then((highlighted) => ({
          match,
          result: `<pre><code class="language-${lang}">${highlighted}</code></pre>`,
        }))
        .catch(() => ({ match, result: match })),
    );
  }
  let result = html;
  for (const { match, result: replacement } of await Promise.all(replacements)) {
    result = result.replace(match, replacement);
  }
  return result;
}

function addHeadingAnchors(html: string): string {
  return html.replace(/<(h[1-6])>(.*?)<\/\1>/g, (_match, tag: string, content: string) => {
    const id = content
      .replace(/<[^>]+>/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    return `<${tag} id="${id}"><a href="#${id}">#</a>${content}</${tag}>`;
  });
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

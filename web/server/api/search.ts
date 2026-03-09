import { defineHandler, getQuery } from "nitro/h3";
import { useDocs } from "../docs.ts";
import { parseMeta, renderToText } from "md4x/napi";

export default defineHandler(async (event) => {
  const { q, limit } = getQuery<{ q?: string; limit?: string }>(event);
  if (!q || q.length < 2) {
    return { results: [] };
  }

  const docs = await useDocs();
  const maxResults = Math.min(Number(limit) || 20, 50);
  const query = q.toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);

  type ScoredResult = {
    path: string;
    title: string;
    heading?: string;
    snippets: string[];
    score: number;
  };

  const scored: ScoredResult[] = [];
  const titleMatched = new Set<string>();

  // Pass 1: Match against nav tree titles (no I/O)
  for (const flat of docs.pages) {
    const title = flat.entry.title;
    const titleLower = title.toLowerCase();
    if (!terms.every((t) => titleLower.includes(t))) continue;
    titleMatched.add(flat.entry.path);
    scored.push({
      path: flat.entry.path,
      title,
      score: titleLower === query ? 0 : 100,
      snippets: [],
    });
  }

  // Pass 2: Search content for heading and body matches (skips title-matched pages)
  for (const flat of docs.pages) {
    if (titleMatched.has(flat.entry.path)) continue;

    const raw = await docs.getContent(flat);
    if (!raw) continue;

    const contentLower = raw.toLowerCase();
    if (!terms.every((t) => contentLower.includes(t))) continue;

    // Check headings first
    let score = 300;
    let matchedHeading: string | undefined;
    const meta = parseMeta(raw);
    for (const h of meta.headings || []) {
      const hLower = h.text.toLowerCase();
      if (terms.every((t) => hLower.includes(t))) {
        score = hLower === query ? 150 : 200;
        matchedHeading = h.text;
        break;
      }
    }

    const plain = renderToText(raw);
    const snippets = extractSnippets(plain, terms);

    scored.push({
      path: flat.entry.path,
      title: flat.entry.title,
      heading: matchedHeading,
      snippets,
      score,
    });
  }

  // Lazy-load snippets for title-matched pages
  for (const result of scored) {
    if (result.snippets.length > 0) continue;
    const flat = docs.pages.find((f) => f.entry.path === result.path);
    if (!flat) continue;
    const raw = await docs.getContent(flat);
    if (!raw) continue;
    const plain = renderToText(raw);
    result.snippets = extractSnippets(plain, terms);
  }

  // Sort by score (lower = better match) then truncate
  scored.sort((a, b) => a.score - b.score);
  const results = scored.slice(0, maxResults).map(({ score: _, ...r }) => r);

  return { results };
});

/** Extract short text snippets around matching terms. */
function extractSnippets(
  content: string,
  terms: string[],
  opts: { maxSnippets?: number; radius?: number } = {},
): string[] {
  const { maxSnippets = 3, radius = 80 } = opts;

  const lower = content.toLowerCase();
  const positions: number[] = [];

  for (const term of terms) {
    let idx = lower.indexOf(term);
    while (idx !== -1 && positions.length < maxSnippets * 2) {
      positions.push(idx);
      idx = lower.indexOf(term, idx + term.length);
    }
  }

  positions.sort((a, b) => a - b);

  // Merge overlapping ranges and build snippets
  const snippets: string[] = [];
  let prevEnd = -1;

  for (const pos of positions) {
    if (snippets.length >= maxSnippets) break;
    const start = Math.max(0, pos - radius);
    const end = Math.min(content.length, pos + radius);
    if (start <= prevEnd) continue; // skip overlapping
    prevEnd = end;

    let snippet = content.slice(start, end).trim().replaceAll(/\s+/g, " ");
    if (start > 0) snippet = "…" + snippet;
    if (end < content.length) snippet = snippet + "…";

    snippets.push(snippet);
  }

  return snippets;
}

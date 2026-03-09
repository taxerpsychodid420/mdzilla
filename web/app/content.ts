export function renderContent(el: HTMLElement, html: string) {
  el.innerHTML = `<article class="prose prose-gray max-w-none">${html}</article>`;
  for (const a of el.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const href = a.getAttribute("href")!;
    if (href.startsWith("/")) {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        history.pushState(null, "", href);
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
    } else if (href.startsWith("#")) {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const id = href.slice(1);
        const target = document.getElementById(id) || el.querySelector(`[id="${CSS.escape(id)}"]`);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
          history.replaceState(null, "", href);
        }
      });
    } else if (/^https?:\/\//.test(href)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  }
}

export async function loadPage(el: HTMLElement, path: string) {
  renderContent(el, `<p class="text-gray-400">Loading...</p>`);
  const res = await fetch(`/api/page?path=${encodeURIComponent(path)}`);
  const data = await res.json();
  if (data.error) {
    renderContent(el, `<p class="text-red-500">${data.error}</p>`);
  } else {
    renderContent(el, data.html);
    const hash = location.hash.slice(1);
    if (hash) {
      const target = document.getElementById(hash) || el.querySelector(`[id="${CSS.escape(hash)}"]`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  }
}

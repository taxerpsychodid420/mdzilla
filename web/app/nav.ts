export interface NavItem {
  title: string;
  path: string;
  page?: false;
  children?: NavItem[];
}

function hasDescendant(item: NavItem, path: string): boolean {
  if (item.path === path) return true;
  return item.children?.some((c) => hasDescendant(c, path)) ?? false;
}

function renderNavChildren(items: NavItem[], depth: number): string {
  return items
    .map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const children = hasChildren ? renderNavChildren(item.children!, depth + 1) : "";
      const paddingLeft = 12 + depth * 12;
      const isNavigatable =
        item.page !== false && !(hasChildren && item.children?.[0]?.path === item.path);
      const tag = isNavigatable
        ? `<a href="${item.path}"
            class="nav-link block py-1.5 text-sm ${hasChildren ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"} hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100 rounded-md transition-colors"
            style="padding-left: ${paddingLeft}px; padding-right: 12px"
            data-path="${item.path}">
            ${item.title}
          </a>`
        : `<span
            class="block py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-default"
            style="padding-left: ${paddingLeft}px; padding-right: 12px">
            ${item.title}
          </span>`;
      return `
        <li>
          ${tag}
          ${children ? `<ul class="mt-0.5">${children}</ul>` : ""}
        </li>`;
    })
    .join("");
}

function renderTopLevel(items: NavItem[], activePath: string): string {
  const hasActive = items.some((item) => hasDescendant(item, activePath));
  let isFirstSection = true;
  return items
    .map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      if (!hasChildren) {
        const isNavigatable = item.page !== false;
        return `<li>${
          isNavigatable
            ? `<a href="${item.path}"
                class="nav-link block py-1.5 px-3 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                data-path="${item.path}">
                ${item.title}
              </a>`
            : `<span class="block py-1.5 px-3 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-default">
                ${item.title}
              </span>`
        }</li>`;
      }

      const isActive = hasDescendant(item, activePath);
      const isOpen = isActive || (!hasActive && isFirstSection);
      isFirstSection = false;
      const isNavigatable = item.page !== false && !(item.children?.[0]?.path === item.path);

      const chevron = `<svg class="nav-chevron w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/></svg>`;

      const titleEl = isNavigatable
        ? `<a href="${item.path}"
            class="nav-link flex-1 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            data-path="${item.path}">
            ${item.title}
          </a>`
        : `<span class="flex-1 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
            ${item.title}
          </span>`;

      const children = renderNavChildren(item.children!, 1);

      return `
        <li data-section="${item.path}">
          <div class="flex items-center px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <button class="nav-toggle p-0.5 -ml-1 mr-1" data-section="${item.path}" aria-label="Toggle section">
              ${chevron}
            </button>
            ${titleEl}
          </div>
          <ul class="nav-section mt-0.5 ${isOpen ? "" : "hidden"}" data-section="${item.path}">
            ${children}
          </ul>
        </li>`;
    })
    .join("");
}

export function findFirstPage(items: NavItem[]): string | undefined {
  for (const item of items) {
    if (item.page !== false) return item.path;
    if (item.children) {
      const found = findFirstPage(item.children);
      if (found) return found;
    }
  }
}

let currentItems: NavItem[] = [];

export function renderNav(sidebar: HTMLElement, items: NavItem[]) {
  currentItems = items;
  const activePath = location.pathname;
  sidebar.innerHTML = items.length
    ? `<ul class="space-y-0.5">${renderTopLevel(items, activePath)}</ul>`
    : `<p class="px-3 py-2 text-sm text-gray-400">No pages loaded</p>`;

  sidebar.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    // Toggle section on chevron button click
    const btn = target.closest(".nav-toggle") as HTMLElement;
    if (btn) {
      toggleSection(sidebar, btn.dataset.section!);
      return;
    }
    // Toggle section on non-navigatable title text click
    const sectionLi = target.closest("li[data-section]") as HTMLElement;
    if (sectionLi && !target.closest(".nav-link")) {
      toggleSection(sidebar, sectionLi.dataset.section!);
    }
  });
}

function toggleSection(sidebar: HTMLElement, sectionPath: string) {
  const sectionUl = sidebar.querySelector(
    `ul.nav-section[data-section="${sectionPath}"]`,
  ) as HTMLElement | null;
  if (!sectionUl) return;

  const isHidden = sectionUl.classList.contains("hidden");

  if (isHidden) {
    // Close all other sections
    sidebar.querySelectorAll("ul.nav-section").forEach((el) => {
      el.classList.add("hidden");
    });
    sidebar.querySelectorAll(".nav-chevron").forEach((el) => {
      el.classList.remove("rotate-90");
    });

    // Open this section
    sectionUl.classList.remove("hidden");
    const chevron = sidebar.querySelector(
      `.nav-toggle[data-section="${sectionPath}"] .nav-chevron`,
    );
    chevron?.classList.add("rotate-90");
  } else {
    // Close this section
    sectionUl.classList.add("hidden");
    const chevron = sidebar.querySelector(
      `.nav-toggle[data-section="${sectionPath}"] .nav-chevron`,
    );
    chevron?.classList.remove("rotate-90");
  }
}

export function setActiveLink(sidebar: HTMLElement, path: string) {
  sidebar.querySelectorAll(".nav-link").forEach((el) => {
    const isActive = el.getAttribute("data-path") === path;
    el.classList.toggle("nav-active", isActive);
    el.classList.toggle("font-medium", isActive);
  });

  // Auto-open the section containing the active link
  const activeSection = currentItems.find((item) => hasDescendant(item, path));
  if (activeSection?.children?.length) {
    // Close all sections
    sidebar.querySelectorAll("ul.nav-section").forEach((el) => {
      el.classList.add("hidden");
    });
    sidebar.querySelectorAll(".nav-chevron").forEach((el) => {
      el.classList.remove("rotate-90");
    });

    // Open the active section
    const sectionUl = sidebar.querySelector(`ul.nav-section[data-section="${activeSection.path}"]`);
    sectionUl?.classList.remove("hidden");
    const chevron = sidebar.querySelector(
      `.nav-toggle[data-section="${activeSection.path}"] .nav-chevron`,
    );
    chevron?.classList.add("rotate-90");
  }
}

const iconSun = document.getElementById("icon-sun")!;
const iconMoon = document.getElementById("icon-moon")!;

function applyTheme() {
  const stored = localStorage.getItem("theme");
  const isDark =
    stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  iconSun.classList.toggle("hidden", !isDark);
  iconMoon.classList.toggle("hidden", isDark);
}

export function initTheme() {
  applyTheme();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!localStorage.getItem("theme")) applyTheme();
  });
  document.getElementById("theme-toggle")!.addEventListener("click", () => {
    const isDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "light" : "dark");
    applyTheme();
  });
}

import { exec } from "node:child_process";

export function openInBrowser(url: string): void {
  const parsed = new URL(url);
  if (parsed.hostname === "[::]" || parsed.hostname === "[::1]" || parsed.hostname === "127.0.0.1") {
    parsed.hostname = "localhost";
  }
  url = parsed.href;
  const cmd =
    process.platform === "win32"
      ? `start ${url}`
      : process.platform === "darwin"
        ? `open ${url}`
        : `xdg-open ${url}`;
  exec(cmd, () => {});
}

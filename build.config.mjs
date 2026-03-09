import { execSync } from "node:child_process";
import { defineBuildConfig } from "obuild/config";

export default defineBuildConfig({
  entries: [
    {
      type: "bundle",
      input: ["./src/index.ts", "./src/cli/main.ts"],
    },
  ],
  hooks: {
    async start() {
      execSync("pnpm build", { cwd: "web", stdio: "inherit" });
    },
  },
});

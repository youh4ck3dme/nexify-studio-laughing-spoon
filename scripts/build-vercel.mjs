import { spawnSync } from "node:child_process";

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npm", ["run", "build"], "packages/shared");
run("npm", ["run", "build"], "apps/web");
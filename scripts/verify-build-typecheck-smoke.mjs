import { spawnSync } from "node:child_process";

const commands = ["npm run typecheck", "npm run build"];

for (const display of commands) {
  console.log(`\n> ${display}`);

  const result =
    process.platform === "win32"
      ? spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", display], {
          cwd: process.cwd(),
          stdio: "inherit"
        })
      : spawnSync("npm", display.replace(/^npm\s+/, "").split(" "), {
          cwd: process.cwd(),
          stdio: "inherit"
        });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\nSmoke verification passed: workspace typecheck and build completed successfully.");

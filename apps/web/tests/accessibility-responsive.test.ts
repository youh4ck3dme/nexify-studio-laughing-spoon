import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { mountApp } from "../src/app/mountApp";

const testDir = dirname(fileURLToPath(import.meta.url));
const styles = readFileSync(resolve(testDir, "../src/style.css"), "utf8") +
  readFileSync(resolve(testDir, "../src/styles/tokens.css"), "utf8") +
  readFileSync(resolve(testDir, "../src/styles/layout.css"), "utf8");

describe("FleetRevenue AI accessibility and responsiveness", () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.innerHTML = "";
    document.body.appendChild(root);
    mountApp({ root });
  });

  it("provides a skip link to jump past repeated navigation", () => {
    const skipLink = root.querySelector<HTMLAnchorElement>(".skip-link");
    expect(skipLink).not.toBeNull();
    expect(skipLink?.getAttribute("href")).toBe("#main-content");
  });

  it("keeps primary actions keyboard-reachable", () => {
    const launchBtn = root.querySelector<HTMLButtonElement>('[data-testid="load-demo"]');
    expect(launchBtn).not.toBeNull();
    launchBtn?.focus();
    expect(document.activeElement).toBe(launchBtn);
  });

  it("defines focus-visible treatment for keyboard users", () => {
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain("outline");
  });

  it("respects reduced-motion preference with explicit media query", () => {
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("animation-duration: 0.01ms");
  });

  it("covers desktop, tablet, and mobile breakpoints", () => {
    expect(styles).toContain("@media (max-width: 1024px)");
    expect(styles).toContain("@media (max-width: 768px)");
  });
});

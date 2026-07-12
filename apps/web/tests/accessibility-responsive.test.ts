import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { mountDashboardApp } from "../src/dashboardApp";

const testDir = dirname(fileURLToPath(import.meta.url));
const styles = readFileSync(resolve(testDir, "../src/style.css"), "utf8");

describe("FleetRevenue premium UI accessibility and responsiveness", () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.innerHTML = "";
    document.body.appendChild(root);
    mountDashboardApp({ root });
  });

  it("keeps primary actions keyboard-reachable in natural order", () => {
    const actionButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(".row button"));
    expect(actionButtons.length).toBeGreaterThan(0);

    for (const button of actionButtons) {
      expect(button.tabIndex).toBeGreaterThanOrEqual(0);
      if (!button.disabled) {
        button.focus();
        expect(document.activeElement).toBe(button);
      }
    }
  });

  it("provides a skip link to jump past repeated navigation", () => {
    const skipLink = root.querySelector<HTMLAnchorElement>(".skip-link");
    expect(skipLink).not.toBeNull();
    expect(skipLink?.getAttribute("href")).toBe("#main-content");
  });

  it("exposes polite live-region basics for status updates", () => {
    const status = root.querySelector<HTMLParagraphElement>("#import-state");
    expect(status).not.toBeNull();
    expect(status?.getAttribute("role")).toBe("status");
    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.getAttribute("aria-atomic")).toBe("true");

    const actionList = root.querySelector<HTMLUListElement>("#action-list");
    expect(actionList?.getAttribute("aria-live")).toBe("polite");
  });

  it("defines focus-visible treatment for keyboard users", () => {
    expect(styles).toContain("button:focus-visible");
    expect(styles).toContain(".skip-link:focus-visible");
    expect(styles).toContain("outline: 3px solid");
  });

  it("respects reduced-motion preference with explicit media query", () => {
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("transition-duration: 0.01ms !important");
    expect(styles).toContain("animation-duration: 0.01ms !important");
  });

  it("covers desktop, tablet, and mobile breakpoints", () => {
    expect(styles).toMatch(/\.row\s*\{[^}]*display:\s*flex;/m);
    expect(styles).toContain("@media (max-width: 1024px)");
    expect(styles).toContain("@media (max-width: 768px)");
    expect(styles).toContain("flex-direction: column");
    expect(styles).toContain("width: 100%");
    expect(styles).toContain("grid-template-columns: 1fr");
  });
});

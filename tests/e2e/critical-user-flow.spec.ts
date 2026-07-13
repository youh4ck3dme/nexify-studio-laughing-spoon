import path from "node:path";
import { expect, test } from "@playwright/test";

test("demo flow: load fleet → analyze → simulate → apply best plan → brief", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");

  await expect(page.getByTestId("screen-landing")).toBeVisible();
  await expect(page.getByRole("heading", { name: "FleetRevenue AI" })).toBeVisible();

  await page.getByTestId("load-demo").click();

  await expect(page.getByTestId("screen-command-center")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("period-badge")).toContainText("28-day baseline");
  await expect(page.getByTestId("kpi-revenue")).toBeVisible();
  await expect(page.getByTestId("chart-revenue")).toBeVisible();
  await expect(page.getByTestId("chart-zones")).toBeVisible();
  await expect(page.getByTestId("chart-funnel")).toBeVisible();

  await page.getByRole("button", { name: "Opportunity map" }).click();
  await expect(page.getByTestId("screen-opportunity-map")).toBeVisible();
  await expect(page.getByTestId("opportunity-map")).toBeVisible();

  await page.getByRole("button", { name: "AI recommendations" }).click();
  await expect(page.getByTestId("screen-recommendations")).toBeVisible();
  await expect(page.getByTestId("best-next-action")).toBeVisible();

  await page.getByRole("button", { name: "Simulation studio" }).click();
  await expect(page.getByTestId("screen-simulation")).toBeVisible();
  await expect(page.getByTestId("sim-projected")).toBeVisible();
  await expect(page.getByTestId("projection-table")).toBeVisible();

  const slider = page.locator('[data-testid^="sim-slider-"]').first();
  await slider.fill("50");
  await expect(page.getByTestId("sim-projected")).toBeVisible();

  await page.getByTestId("apply-best-plan").click();
  await expect(page.getByTestId("wow-overlay")).toBeVisible();
  await expect(page.getByTestId("wow-opportunity")).toContainText("35,280");
  await expect(page.getByTestId("wow-opportunity")).toContainText("annual modeled upside");
  await expect(page.getByTestId("wow-subhead")).toContainText("2,297");

  await page.getByTestId("toggle-compare").click();
  await expect(page.getByTestId("wow-compare")).toBeVisible();
  await expect(page.getByTestId("wow-current")).toBeVisible();
  await expect(page.getByTestId("wow-projected")).toBeVisible();

  await page.getByTestId("reset-demo").click();
  await expect(page.getByTestId("screen-landing")).toBeVisible();

  await page.getByTestId("load-demo").click();
  await expect(page.getByTestId("screen-command-center")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("kpi-revenue")).toContainText("5,685");

  await page.getByTestId("judge-mode-toggle").check();
  await expect(page.getByTestId("judge-mode-panel")).toBeVisible();
  await expect(page.getByTestId("judge-q-1")).toBeVisible();

  await page.getByRole("button", { name: "Opportunity map" }).click();
  await page.getByRole("button", { name: "AI recommendations" }).click();
  await page.getByRole("button", { name: "Simulation studio" }).click();
  await page.getByTestId("apply-best-plan").click();
  await page.getByTestId("dismiss-wow").click();
  await expect(page.getByTestId("screen-executive-brief")).toBeVisible();
  await page.getByTestId("why-panel").locator("summary").click();
  await expect(page.getByTestId("why-panel")).toContainText("HOW OPPORTUNITY WAS CALCULATED");

  await page.getByTestId("copy-brief").click();
  await expect(page.getByTestId("copy-status")).toContainText("copied");
});

test("refresh mid-flow resets to landing with deterministic KPIs on relaunch", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("load-demo").click();
  await expect(page.getByTestId("screen-command-center")).toBeVisible({ timeout: 10000 });
  const revenueBefore = await page.getByTestId("kpi-revenue").textContent();

  await page.reload();
  await expect(page.getByTestId("screen-landing")).toBeVisible();

  await page.getByTestId("load-demo").click();
  await expect(page.getByTestId("screen-command-center")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("kpi-revenue")).toHaveText(revenueBefore ?? "");
});

test("CSV upload flow with template files", async ({ page }) => {
  const repoRoot = process.cwd();
  const ridesCsvPath = path.join(repoRoot, "data", "templates", "rides.template.csv");
  const leadsCsvPath = path.join(repoRoot, "data", "templates", "leads.template.csv");

  await page.goto("/");
  await page.getByTestId("show-upload").click();
  await expect(page.getByTestId("upload-panel")).toBeVisible();

  await page.getByTestId("rides-file-input").setInputFiles(ridesCsvPath);
  await page.getByTestId("leads-file-input").setInputFiles(leadsCsvPath);

  await expect(page.getByTestId("analyze-csv")).toBeEnabled();
  await page.getByTestId("analyze-csv").click();

  await expect(page.getByTestId("screen-command-center")).toBeVisible({ timeout: 10000 });
});

test("shows error for malformed CSV upload", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("show-upload").click();

  await page.getByTestId("rides-file-input").setInputFiles({
    name: "bad.csv",
    mimeType: "text/csv",
    buffer: Buffer.from('"unclosed quote\nr1,A')
  });

  await expect(page.locator(".error-banner")).toBeVisible({ timeout: 5000 });
});

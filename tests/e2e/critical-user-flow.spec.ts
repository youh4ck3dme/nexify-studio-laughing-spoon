import path from "node:path";
import { expect, test } from "@playwright/test";

test("uploads CSVs, analyzes recommendations, selects an action, and applies a simulation", async ({
  page
}) => {
  const repoRoot = process.cwd();
  const ridesCsvPath = path.join(repoRoot, "data", "templates", "rides.template.csv");
  const leadsCsvPath = path.join(repoRoot, "data", "templates", "leads.template.csv");

  await page.goto("/");

  await page.getByTestId("rides-file-input").setInputFiles(ridesCsvPath);
  await page.getByTestId("leads-file-input").setInputFiles(leadsCsvPath);

  await expect(page.getByTestId("rides-upload-status")).toHaveText(
    "Rides CSV loaded: rides.template.csv (3 rows)"
  );
  await expect(page.getByTestId("leads-upload-status")).toHaveText(
    "Leads CSV loaded: leads.template.csv (3 rows)"
  );
  await expect(page.getByTestId("run-analysis")).toBeEnabled();

  await page.getByTestId("run-analysis").click();

  await expect(page.getByTestId("import-state")).toHaveText(
    "Analysis complete. Select an action to simulate."
  );
  await expect(page.getByTestId("kpi-rides-value")).toHaveText("3");
  await expect(page.getByTestId("kpi-leads-value")).toHaveText("3");
  await expect(page.getByTestId("kpi-revenue-value")).toHaveText("+11.8%");

  await page.getByTestId("select-action-pricing-evening-boost").click();

  await expect(page.getByTestId("selection-state")).toHaveText(
    "Selected action: Apply +12% dynamic price multiplier in downtown peak"
  );
  await expect(page.getByTestId("kpi-revenue-value")).toHaveText("+11.8%");

  await page.getByTestId("apply-simulation").click();

  await expect(page.getByTestId("applied-state")).toHaveText(
    "Simulation applied: Apply +12% dynamic price multiplier in downtown peak"
  );
  await expect(page.getByTestId("kpi-state")).toHaveText(
    'Applied simulation for "Apply +12% dynamic price multiplier in downtown peak".'
  );
  await expect(page.getByTestId("kpi-revenue-value")).toHaveText("+14.2%");
  await expect(page.getByTestId("kpi-idle-value")).toHaveText("-9.4%");
  await expect(page.getByTestId("kpi-conversion-value")).toHaveText("+13.1%");
});

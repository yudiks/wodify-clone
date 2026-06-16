import { test, expect, ATHLETE, loginAs } from "../fixtures/auth";
import path from "path";

const sampleVideo = path.resolve(__dirname, "../../public/sample.mp4");

test.describe("Athlete submission flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ATHLETE);
  });

  test("dashboard shows upload form and empty submissions list initially", async ({
    page,
  }) => {
    await expect(page.getByText("Upload a new video")).toBeVisible();
    // Empty state shows after DB reset
    await expect(page.getByText("No submissions yet.")).toBeVisible();
  });

  test("athlete can upload a video submission", async ({ page }) => {
    await page.fill('input[name="title"]', "Snatch — heavy single");
    await page.fill('input[name="movementType"]', "Snatch");
    await page.setInputFiles('input[type="file"]', sampleVideo);
    await page.click('button:has-text("Upload")');

    await expect(page.getByText("Snatch — heavy single")).toBeVisible({
      timeout: 20000,
    });
    // Pending badge
    await expect(page.locator(".bg-amber-100, .bg-amber-900\\/40").first()).toBeVisible();
  });

  test("submission appears in list with correct metadata", async ({ page }) => {
    const title = `Clean & Jerk ${Date.now()}`;
    await page.fill('input[name="title"]', title);
    await page.fill('input[name="movementType"]', "Clean & Jerk");
    await page.setInputFiles('input[type="file"]', sampleVideo);
    await page.click('button:has-text("Upload")');

    await expect(page.getByText(title)).toBeVisible({ timeout: 20000 });

    const card = page.locator(`a:has-text("${title}")`);
    // The subtitle p has movement · date — match the subtitle specifically
    await expect(card.locator("p.text-sm").filter({ hasText: "Clean & Jerk" })).toBeVisible();
    await expect(card.getByText("0 annotations")).toBeVisible();
    await expect(card.getByText("0 comments")).toBeVisible();
  });

  test("athlete can view a submission detail page", async ({ page }) => {
    await page.fill('input[name="title"]', "Front Squat Detail Test");
    await page.fill('input[name="movementType"]', "Front Squat");
    await page.setInputFiles('input[type="file"]', sampleVideo);
    await page.click('button:has-text("Upload")');
    await expect(page.getByText("Front Squat Detail Test")).toBeVisible({
      timeout: 20000,
    });

    await page.click('a:has-text("Front Squat Detail Test")');
    await expect(page).toHaveURL(/\/submissions\//);
    await expect(
      page.getByRole("heading", { name: "Front Squat Detail Test" })
    ).toBeVisible();
    await expect(page.locator("video")).toBeVisible();
    // Athletes should not see annotation controls
    await expect(
      page.getByText("Add annotation at current frame")
    ).not.toBeVisible();
  });

  test("athlete can post a comment on their own submission", async ({
    page,
  }) => {
    await page.fill('input[name="title"]', "Deadlift Comment Test");
    await page.fill('input[name="movementType"]', "Deadlift");
    await page.setInputFiles('input[type="file"]', sampleVideo);
    await page.click('button:has-text("Upload")');
    await expect(page.getByText("Deadlift Comment Test")).toBeVisible({
      timeout: 20000,
    });

    await page.click('a:has-text("Deadlift Comment Test")');
    await expect(page).toHaveURL(/\/submissions\//);

    await page.fill(
      'textarea[placeholder*="comment"]',
      "Coach, please check my hip hinge."
    );
    await page.click('button:has-text("Post comment")');

    await expect(
      page.getByText("Coach, please check my hip hinge.")
    ).toBeVisible({ timeout: 10000 });
    // Author name in the comment header
    await expect(
      page.locator("li").filter({ hasText: "Coach, please check my hip hinge." }).getByText(ATHLETE.name)
    ).toBeVisible();
  });
});

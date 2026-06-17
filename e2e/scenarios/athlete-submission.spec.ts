import { test, expect, ATHLETE, loginAs, uploadVideo } from "../fixtures/auth";

test.describe("Athlete submission flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ATHLETE);
  });

  test("dashboard shows an empty submissions list initially", async ({ page }) => {
    await expect(page.getByText("No videos found")).toBeVisible();
  });

  test("upload page shows the upload form", async ({ page }) => {
    await page.goto("/upload");
    await expect(page.getByText("Upload a new video")).toBeVisible();
  });

  test("athlete can upload a video submission", async ({ page }) => {
    await uploadVideo(page, "Snatch — heavy single");

    await expect(page.getByText("Snatch — heavy single")).toBeVisible();
    // Pending badge
    await expect(page.locator(".status-pill.pending").first()).toBeVisible();
  });

  test("submission appears in list with correct metadata", async ({ page }) => {
    const title = `Clean & Jerk ${Date.now()}`;
    await uploadVideo(page, title);

    const card = page.locator(`a:has-text("${title}")`);
    await expect(card.getByText("0 annotations")).toBeVisible();
    await expect(card.getByText("0 comments")).toBeVisible();
  });

  test("athlete can view a submission detail page", async ({ page }) => {
    await uploadVideo(page, "Front Squat Detail Test");

    await page.click('a:has-text("Front Squat Detail Test")');
    await expect(page).toHaveURL(/\/submissions\//);
    await expect(
      page.getByRole("heading", { name: "Front Squat Detail Test" })
    ).toBeVisible();
    await expect(page.locator("video")).toBeVisible();
    // Athletes can annotate their own submission (canAnnotate = isCoach || isOwner)
    await expect(
      page.getByText("Add annotation at current frame")
    ).toBeVisible();
  });

  test("athlete can post a comment on their own submission", async ({
    page,
  }) => {
    await uploadVideo(page, "Deadlift Comment Test");

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

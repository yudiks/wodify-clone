/**
 * Full end-to-end workflow:
 *   1. Athlete submits a video
 *   2. Coach reviews it, adds two annotations, and posts a comment
 *   3. Athlete sees the submission is now Reviewed, reads annotations and coach comment
 *   4. Athlete replies with a follow-up comment
 *   5. Coach reads the athlete's reply
 */
import { test, expect, ATHLETE, COACH, BLANK_PNG, loginAs } from "../fixtures/auth";
import path from "path";

const sampleVideo = path.resolve(__dirname, "../../public/sample.mp4");

async function postAnnotationViaApi(
  page: import("@playwright/test").Page,
  submissionId: string,
  note: string,
  timestampSec: number
) {
  const status = await page.evaluate(
    async ({ submissionId, note, timestampSec, BLANK_PNG }) => {
      const res = await fetch(`/api/submissions/${submissionId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestampSec, drawingDataUrl: BLANK_PNG, note }),
      });
      return res.status;
    },
    { submissionId, note, timestampSec, BLANK_PNG }
  );
  expect(status).toBe(201);
}

test("full athlete → coach → athlete workflow", async ({ page }) => {
  const title = `Full Workflow ${Date.now()}`;

  // ── Step 1: Athlete uploads a video ──────────────────────────────────────
  await loginAs(page, ATHLETE);
  await page.fill('input[name="title"]', title);
  await page.fill('input[name="movementType"]', "Snatch");
  await page.setInputFiles('input[type="file"]', sampleVideo);
  await page.click('button:has-text("Upload")');
  await expect(page.getByText(title)).toBeVisible({ timeout: 20_000 });

  // Capture submission ID from the card link
  const href = await page.locator(`a:has-text("${title}")`).getAttribute("href");
  const submissionId = href!.split("/submissions/")[1];

  // Submission is pending for the athlete
  const athleteCard = page.locator(`a:has-text("${title}")`);
  await expect(athleteCard.getByText("0 annotations")).toBeVisible();

  // ── Step 2: Coach adds two annotations and a comment ─────────────────────
  await loginAs(page, COACH);

  // Submission appears in Pending section of coach inbox
  const pendingSection = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Pending review/ }) });
  await expect(pendingSection.getByText(title)).toBeVisible();
  await expect(pendingSection.locator("a").filter({ hasText: title }).getByText(ATHLETE.name)).toBeVisible();

  // Open the submission
  await page.click(`a:has-text("${title}")`);
  await expect(page).toHaveURL(/\/submissions\//);
  await expect(page.locator("video")).toBeVisible();
  await expect(page.getByText("Add annotation at current frame")).toBeVisible();

  // Add two annotations via API (coach is already logged in so cookies are active)
  await postAnnotationViaApi(page, submissionId, "Keep your chest up through the catch.", 1.5);
  await postAnnotationViaApi(page, submissionId, "Elbows need to be higher in the receiving position.", 4.0);

  // Reload and verify both annotation timestamps appear
  await page.reload();
  await expect(page.locator('button:has-text("0:01")')).toBeVisible();
  await expect(page.locator('button:has-text("0:04")')).toBeVisible();

  // Coach posts a comment
  await page.fill('textarea[placeholder*="comment"]', "Overall a solid lift — two things to work on above.");
  await page.click('button:has-text("Post comment")');
  const coachComment = page.locator("li").filter({ hasText: "Overall a solid lift" });
  await expect(coachComment).toBeVisible({ timeout: 10_000 });
  await expect(coachComment.getByText(COACH.name, { exact: true })).toBeVisible();
  await expect(coachComment.getByText("· COACH")).toBeVisible();

  // Submission now appears under Reviewed in coach inbox
  await page.goto("/coach");
  const reviewedSection = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Reviewed/ }) });
  await expect(reviewedSection.getByText(title)).toBeVisible();

  // ── Step 3: Athlete sees submission is Reviewed ───────────────────────────
  await loginAs(page, ATHLETE);

  // Card on dashboard reflects new state
  const updatedCard = page.locator(`a:has-text("${title}")`);
  await expect(updatedCard.getByText("2 annotations")).toBeVisible();
  await expect(updatedCard.getByText("1 comment")).toBeVisible();
  // Status badge should now be Reviewed (green-ish), not Pending (amber)
  await expect(updatedCard.locator(".bg-amber-100, .bg-amber-900\\/40")).not.toBeVisible();

  // Open the submission detail
  await page.click(`a:has-text("${title}")`);
  await expect(page).toHaveURL(/\/submissions\//);

  // Annotation timestamps visible to athlete too
  await expect(page.locator('button:has-text("0:01")')).toBeVisible();
  await expect(page.locator('button:has-text("0:04")')).toBeVisible();

  // Click first annotation and read its note
  await page.click('button:has-text("0:01")');
  await expect(page.getByText("Keep your chest up through the catch.")).toBeVisible();

  // Coach comment is visible
  await expect(page.getByText("Overall a solid lift — two things to work on above.")).toBeVisible();

  // Athlete cannot see annotation controls
  await expect(page.getByText("Add annotation at current frame")).not.toBeVisible();

  // ── Step 4: Athlete posts a follow-up comment ─────────────────────────────
  await page.fill('textarea[placeholder*="comment"]', "Thanks coach! I'll focus on elbow speed in my next session.");
  await page.click('button:has-text("Post comment")');
  const athleteReply = page.locator("li").filter({
    hasText: "Thanks coach! I'll focus on elbow speed",
  });
  await expect(athleteReply).toBeVisible({ timeout: 10_000 });
  await expect(athleteReply.getByText(ATHLETE.name, { exact: true })).toBeVisible();

  // Thread now has 2 comments total
  await page.goto("/dashboard");
  await expect(page.locator(`a:has-text("${title}")`).getByText("2 comments")).toBeVisible();

  // ── Step 5: Coach reads the athlete's reply ───────────────────────────────
  await loginAs(page, COACH);
  await page.goto(`/submissions/${submissionId}`);

  const thread = page.locator("li");
  await expect(thread.filter({ hasText: "Overall a solid lift" })).toBeVisible();
  await expect(
    thread.filter({ hasText: "Thanks coach! I'll focus on elbow speed" })
  ).toBeVisible();

  // Athlete reply has ATHLETE name and no COACH badge
  const athleteReplyCoachView = thread.filter({
    hasText: "Thanks coach! I'll focus on elbow speed",
  });
  await expect(athleteReplyCoachView.getByText(ATHLETE.name, { exact: true })).toBeVisible();
  await expect(athleteReplyCoachView.getByText("· COACH")).not.toBeVisible();
});

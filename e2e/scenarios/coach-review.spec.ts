import { test, expect, ATHLETE, COACH, BLANK_PNG, loginAs } from "../fixtures/auth";
import path from "path";

const sampleVideo = path.resolve(__dirname, "../../public/sample.mp4");

async function createSubmission(
  page: import("@playwright/test").Page,
  title: string
): Promise<string> {
  await page.goto("/dashboard");
  await page.fill('input[name="title"]', title);
  await page.fill('input[name="movementType"]', "Snatch");
  await page.setInputFiles('input[type="file"]', sampleVideo);
  await page.click('button:has-text("Upload")');
  await expect(page.getByText(title)).toBeVisible({ timeout: 20000 });
  const href = await page.locator(`a:has-text("${title}")`).getAttribute("href");
  return href!.split("/submissions/")[1];
}

async function postAnnotationViaApi(
  page: import("@playwright/test").Page,
  submissionId: string,
  note: string,
  timestampSec = 0
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

test.describe("Coach review flow", () => {
  test("coach inbox shows pending submissions from athletes", async ({
    page,
  }) => {
    await loginAs(page, ATHLETE);
    const title = `Coach Inbox Test ${Date.now()}`;
    await createSubmission(page, title);

    await loginAs(page, COACH);
    await expect(page.getByRole("heading", { name: /Pending review/ })).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();
    // Athlete name shown in coach view
    await expect(
      page.locator("a").filter({ hasText: title }).getByText(ATHLETE.name)
    ).toBeVisible();
  });

  test("coach can open a submission and sees video + annotation controls", async ({
    page,
  }) => {
    await loginAs(page, ATHLETE);
    const title = `Coach Open Test ${Date.now()}`;
    await createSubmission(page, title);

    await loginAs(page, COACH);
    await page.click(`a:has-text("${title}")`);
    await expect(page).toHaveURL(/\/submissions\//);
    await expect(page.locator("video")).toBeVisible();
    await expect(page.getByText("Add annotation at current frame")).toBeVisible();
  });

  test("coach can add an annotation and submission moves to Reviewed", async ({
    page,
  }) => {
    await loginAs(page, ATHLETE);
    const title = `Annotation Test ${Date.now()}`;
    const id = await createSubmission(page, title);

    await loginAs(page, COACH);
    await page.goto(`/submissions/${id}`);
    await postAnnotationViaApi(page, id, "Keep your chest up through the catch.", 1.5);

    await page.reload();
    // Annotation timestamp badge appears
    await expect(page.locator('button:has-text("0:01")')).toBeVisible();

    // Submission moves from pending → reviewed on coach inbox
    await page.goto("/coach");
    const reviewedSection = page.locator("section").filter({
      has: page.getByText(/Reviewed/),
    }).last();
    await expect(reviewedSection.getByText(title)).toBeVisible();
  });

  test("coach can post a comment on a submission", async ({ page }) => {
    await loginAs(page, ATHLETE);
    const title = `Coach Comment Test ${Date.now()}`;
    await createSubmission(page, title);

    await loginAs(page, COACH);
    await page.click(`a:has-text("${title}")`);
    await expect(page).toHaveURL(/\/submissions\//);

    await page.fill(
      'textarea[placeholder*="comment"]',
      "Great depth — watch the bar path on the way down."
    );
    await page.click('button:has-text("Post comment")');

    const commentItem = page
      .locator("li")
      .filter({ hasText: "Great depth — watch the bar path on the way down." });
    await expect(commentItem).toBeVisible({ timeout: 10000 });
    await expect(commentItem.getByText(COACH.name, { exact: true })).toBeVisible();
    // Role badge is rendered as "· COACH"
    await expect(commentItem.getByText("· COACH")).toBeVisible();
  });

  test("annotation note is displayed with coach name and timestamp", async ({
    page,
  }) => {
    await loginAs(page, ATHLETE);
    const title = `Annotation Display Test ${Date.now()}`;
    const id = await createSubmission(page, title);

    await loginAs(page, COACH);
    await page.goto(`/submissions/${id}`);
    await postAnnotationViaApi(
      page,
      id,
      "Elbows need to be higher in the catch.",
      3
    );

    await page.reload();
    await page.click('button:has-text("0:03")');
    const annotationCard = page.locator("div").filter({
      hasText: "Elbows need to be higher in the catch.",
    }).last();
    await expect(annotationCard).toBeVisible();
    await expect(annotationCard.getByText(COACH.name, { exact: false })).toBeVisible();
  });

  test("reviewed submissions appear in the Reviewed section of coach inbox", async ({
    page,
  }) => {
    await loginAs(page, ATHLETE);
    const title = `Reviewed Section Test ${Date.now()}`;
    const id = await createSubmission(page, title);

    await loginAs(page, COACH);
    await page.goto(`/submissions/${id}`);
    await postAnnotationViaApi(page, id, "Good lift.");

    await page.goto("/coach");
    const reviewedSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: /Reviewed/ }) });
    await expect(reviewedSection.getByText(title)).toBeVisible();
  });
});

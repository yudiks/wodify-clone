import { test, expect, ATHLETE, COACH, loginAs } from "../fixtures/auth";

test.describe("Role-based access control", () => {
  test("athlete is redirected away from /coach", async ({ page }) => {
    await loginAs(page, ATHLETE);
    await page.goto("/coach");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("coach is redirected away from /dashboard", async ({ page }) => {
    await loginAs(page, COACH);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/coach/);
  });

  test("authenticated athlete on home page is redirected to /dashboard", async ({
    page,
  }) => {
    await loginAs(page, ATHLETE);
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("authenticated coach on home page is redirected to /coach", async ({
    page,
  }) => {
    await loginAs(page, COACH);
    await page.goto("/");
    await expect(page).toHaveURL(/\/coach/);
  });

  test("POSTing an annotation to a nonexistent submission returns 404", async ({
    page,
  }) => {
    await loginAs(page, ATHLETE);
    const status = await page.evaluate(async () => {
      const res = await fetch("/api/submissions/fake-id/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestampSec: 0,
          drawingDataUrl: "data:image/png;base64,abc",
          note: "sneaky",
        }),
      });
      return res.status;
    });
    expect(status).toBe(404);
  });

  test("athlete cannot POST an annotation on another athlete's submission (API-level enforcement)", async ({
    page,
  }) => {
    // Two throwaway athletes, kept separate from the shared seeded ATHLETE
    // account so this test doesn't leave a submission behind for other
    // specs that assume a clean dashboard.
    const emailA = `athlete-a-${Date.now()}@example.com`;
    await page.request.post("/api/register", {
      data: { name: "Athlete A", email: emailA, password: "password123", role: "ATHLETE" },
    });
    await loginAs(page, { email: emailA, password: "password123" });

    const submissionId = await page.evaluate(async () => {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Athlete A's video",
          videoUrl: "https://example.com/video.mp4",
        }),
      });
      const data = await res.json();
      return data.id as string;
    });

    // Athlete B registers and tries to annotate athlete A's submission.
    const emailB = `athlete-b-${Date.now()}@example.com`;
    await page.request.post("/api/register", {
      data: { name: "Athlete B", email: emailB, password: "password123", role: "ATHLETE" },
    });
    await loginAs(page, { email: emailB, password: "password123" });

    const status = await page.evaluate(
      async (submissionId) => {
        const res = await fetch(`/api/submissions/${submissionId}/annotations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timestampSec: 0,
            drawingDataUrl: "data:image/png;base64,abc",
            note: "sneaky",
          }),
        });
        return res.status;
      },
      submissionId
    );
    expect(status).toBe(403);
  });

  test("unauthenticated request to /api/submissions returns 401", async ({
    request,
  }) => {
    const res = await request.get("/api/submissions");
    expect(res.status()).toBe(401);
  });
});

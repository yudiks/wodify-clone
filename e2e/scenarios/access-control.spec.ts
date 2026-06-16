import { test, expect, ATHLETE, COACH, BLANK_PNG, loginAs } from "../fixtures/auth";

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

  test("athlete cannot POST an annotation (API-level enforcement)", async ({
    page,
  }) => {
    await loginAs(page, ATHLETE);
    // Use page.evaluate to make a fetch with the session cookie already present
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
    expect(status).toBe(403);
  });

  test("unauthenticated request to /api/submissions returns 401", async ({
    request,
  }) => {
    const res = await request.get("/api/submissions");
    expect(res.status()).toBe(401);
  });
});

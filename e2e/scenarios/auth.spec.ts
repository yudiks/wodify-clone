import { test, expect, ATHLETE, COACH, loginAs, logout } from "../fixtures/auth";

test.describe("Authentication", () => {
  test("redirects unauthenticated users from protected pages to /login", async ({
    page,
  }) => {
    for (const path of ["/dashboard", "/coach", "/upload", "/submissions/nonexistent"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("athlete can log in and lands on /dashboard", async ({ page }) => {
    await loginAs(page, ATHLETE);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("My Video Submissions")).toBeVisible();
  });

  test("coach can log in and lands on /coach", async ({ page }) => {
    await loginAs(page, COACH);
    await expect(page).toHaveURL(/\/coach/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Coaching Lift Queue")).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', ATHLETE.email);
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("athlete can sign out and session is cleared", async ({ page }) => {
    await loginAs(page, ATHLETE);
    await logout(page);
    // After sign out we land on home (/); dashboard should now redirect to login
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("new user can register as athlete", async ({ page }) => {
    await page.goto("/register");
    const inputs = page.locator("form input");
    await inputs.nth(0).fill("Test Runner");
    await inputs.nth(1).fill(`runner+${Date.now()}@example.com`);
    await inputs.nth(2).fill("password123");
    // Athlete radio is default — no change needed
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

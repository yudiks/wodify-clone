import { test as base, expect, type Page } from "@playwright/test";

export { expect } from "@playwright/test";

// Custom test that intercepts Vercel Blob CDN uploads in CI so tests don't
// require real network access to vercel.com/api/blob.
export const test = base.extend<Record<string, never>>({
  page: async ({ page }, use) => {
    if (process.env.CI) {
      await page.route("https://vercel.com/api/blob**", async (route) => {
        if (route.request().method() === "PUT") {
          const reqUrl = new URL(route.request().url());
          const pathname = reqUrl.searchParams.get("pathname") ?? "test-video.mp4";
          const fakeUrl = `https://public.blob.vercel-storage.com/${pathname}`;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              url: fakeUrl,
              downloadUrl: `${fakeUrl}?download=1`,
              pathname,
              contentType: "video/mp4",
              contentDisposition: `inline; filename="${pathname}"`,
            }),
          });
        } else {
          await route.continue();
        }
      });
    }
    await use(page);
  },
});

export const ATHLETE = {
  email: "athlete@example.com",
  password: "athletepass123",
  name: "Alex Athlete",
  role: "ATHLETE",
};

export const COACH = {
  email: "coach@example.com",
  password: "coachpass123",
  name: "Coach Carter",
  role: "COACH",
};

export async function loginAs(
  page: Page,
  user: { email: string; password: string }
) {
  await page.goto("/login");
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|coach)/);
}

export async function logout(page: Page) {
  await page.click('button:has-text("Sign out")');
  // signOut({ callbackUrl: "/" }) lands on /, not /login
  await page.waitForURL("/");
}

/** Minimal 1×1 transparent PNG as a data URL for annotation drawing tests. */
export const BLANK_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

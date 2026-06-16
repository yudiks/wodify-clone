import { type Page } from "@playwright/test";

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

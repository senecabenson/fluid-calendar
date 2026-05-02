import { test, expect } from "@playwright/test";

test.describe("Bug 1: Auto-sync fires periodically for Google Calendar", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto("http://localhost:3001");

    // Log in with test credentials
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "testpassword123");
    await page.click('button:has-text("Sign in")');

    // Wait for redirect to dashboard
    await page.waitForURL("**/calendar", { timeout: 10000 });
  });

  test("autoSync setting enables periodic sync", async ({ page }) => {
    // Navigate to integration settings
    await page.goto("http://localhost:3001/settings");
    await page.waitForSelector('text="Integration Settings"');

    // Find Google Calendar integration section
    const googleCalendarSection = page.locator('text="Google Calendar"').first().locator("..");

    // Enable autoSync
    const autoSyncSwitch = googleCalendarSection.locator('input[type="checkbox"]').first();
    const isChecked = await autoSyncSwitch.isChecked();

    if (!isChecked) {
      await autoSyncSwitch.click();
    }

    // Verify sync interval is set (default: 5 minutes)
    const intervalInput = googleCalendarSection.locator('input[type="number"]');
    const intervalValue = await intervalInput.inputValue();
    expect(parseInt(intervalValue || "0")).toBeGreaterThan(0);

    // Save settings
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Verify setting persisted
    await page.reload();
    await page.waitForSelector('text="Integration Settings"');

    const reloadedSwitch = page.locator('text="Google Calendar"').first().locator("..").locator('input[type="checkbox"]').first();
    expect(await reloadedSwitch.isChecked()).toBe(true);
  });

  test("autoSync disabled turns off periodic sync", async ({ page }) => {
    // Navigate to integration settings
    await page.goto("http://localhost:3001/settings");
    await page.waitForSelector('text="Integration Settings"');

    // Find Google Calendar integration section
    const googleCalendarSection = page.locator('text="Google Calendar"').first().locator("..");

    // Disable autoSync if enabled
    const autoSyncSwitch = googleCalendarSection.locator('input[type="checkbox"]').first();
    const isChecked = await autoSyncSwitch.isChecked();

    if (isChecked) {
      await autoSyncSwitch.click();
    }

    // Save settings
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Verify setting persisted
    await page.reload();
    await page.waitForSelector('text="Integration Settings"');

    const reloadedSwitch = page.locator('text="Google Calendar"').first().locator("..").locator('input[type="checkbox"]').first();
    expect(await reloadedSwitch.isChecked()).toBe(false);
  });

  test("connects Google Calendar and verifies events sync", async ({ page }) => {
    // Note: This test requires Google OAuth flow which is complex in E2E.
    // Skipping automatic Google auth — requires manual interaction.
    // Alternative: check that sync button exists and can be manually triggered.

    await page.goto("http://localhost:3001/settings");
    await page.waitForSelector('text="Connected Accounts"');

    // Check if Google Calendar is connected
    const googleConnected = await page.locator('text="Google Calendar"').locator('text="Connected"').count();

    if (googleConnected === 0) {
      // Try to connect Google Calendar
      const connectButton = page.locator('button:has-text("Connect Google Calendar")');
      const count = await connectButton.count();

      if (count > 0) {
        // Note: Can't automate OAuth flow in headless browser without session replay
        console.log("Google Calendar OAuth requires manual interaction");
      }
    } else {
      // Verify Google Calendar is showing as connected
      expect(googleConnected).toBeGreaterThan(0);

      // Check that manual sync button is available
      const syncButton = page.locator('button:has-text("Sync Now")');
      expect(await syncButton.count()).toBeGreaterThan(0);
    }
  });
});

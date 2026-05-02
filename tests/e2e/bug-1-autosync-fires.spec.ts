import { test, expect } from "@playwright/test";

test.describe("Bug 1: Auto-sync fires periodically for Google Calendar", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto("http://localhost:3001");

    // Log in with test credentials
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "testpassword123");
    await page.click('button:has-text("Sign In")');

    // Wait for redirect to calendar page
    await page.waitForURL("**/calendar", { timeout: 10000 });
  });

  test("autoSync toggle persists after save and reload", async ({ page }) => {
    // Navigate to settings
    await page.goto("http://localhost:3001/settings");

    // Wait for Integration Settings section to load
    await page.waitForSelector('text="Integration Settings"', { timeout: 5000 });

    // Find the Google Calendar section heading
    const googleCalendarSection = page.locator('text="Google Calendar"').first();

    // Locate the autoSync checkbox within the integration section
    // The checkbox is a custom styled input[type="checkbox"] with class sr-only
    const integrationContainer = googleCalendarSection.locator("..").locator("..");
    const autoSyncCheckbox = integrationContainer.locator('input[type="checkbox"]').first();

    // Check if autoSync is currently enabled
    const isCurrentlyChecked = await autoSyncCheckbox.isChecked();

    // If not enabled, enable it
    if (!isCurrentlyChecked) {
      await autoSyncCheckbox.click();
      await page.waitForTimeout(500);
    }

    // Verify the autoSync checkbox is now enabled
    expect(await autoSyncCheckbox.isChecked()).toBe(true);

    // Verify that the sync interval field exists and has a positive value
    // The interval field should be visible when autoSync is enabled
    const syncIntervalInput = integrationContainer.locator('input[type="number"]');
    const intervalValue = await syncIntervalInput.inputValue();
    expect(parseInt(intervalValue || "0", 10)).toBeGreaterThan(0);

    // Save settings (if there's a save button)
    const saveButton = page.locator('button:has-text("Save")');
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(1000);
    }

    // Reload the page to verify persistence
    await page.reload();

    // Wait for settings to reload
    await page.waitForSelector('text="Integration Settings"', { timeout: 5000 });

    // Verify that autoSync is still enabled after reload
    const googleCalendarSectionAfterReload = page
      .locator('text="Google Calendar"')
      .first();
    const reloadedContainer = googleCalendarSectionAfterReload.locator("..").locator("..");
    const reloadedCheckbox = reloadedContainer.locator('input[type="checkbox"]').first();

    expect(await reloadedCheckbox.isChecked()).toBe(true);
  });

  test("autoSync can be toggled on and off", async ({ page }) => {
    // Navigate to settings
    await page.goto("http://localhost:3001/settings");

    // Wait for Integration Settings section
    await page.waitForSelector('text="Integration Settings"', { timeout: 5000 });

    // Get the autoSync checkbox
    const googleCalendarSection = page.locator('text="Google Calendar"').first();
    const integrationContainer = googleCalendarSection.locator("..").locator("..");
    const autoSyncCheckbox = integrationContainer.locator('input[type="checkbox"]').first();

    // Get initial state
    const initialState = await autoSyncCheckbox.isChecked();

    // Toggle the checkbox
    await autoSyncCheckbox.click();
    await page.waitForTimeout(500);

    // Verify it's been toggled
    const newState = await autoSyncCheckbox.isChecked();
    expect(newState).toBe(!initialState);

    // Toggle it back to original state
    await autoSyncCheckbox.click();
    await page.waitForTimeout(500);

    // Verify it's back to original state
    const finalState = await autoSyncCheckbox.isChecked();
    expect(finalState).toBe(initialState);
  });

  test("autoSync interval field is editable when enabled", async ({ page }) => {
    // Navigate to settings
    await page.goto("http://localhost:3001/settings");

    // Wait for Integration Settings
    await page.waitForSelector('text="Integration Settings"', { timeout: 5000 });

    // Get the Google Calendar section
    const googleCalendarSection = page.locator('text="Google Calendar"').first();
    const integrationContainer = googleCalendarSection.locator("..").locator("..");

    // Get the autoSync checkbox
    const autoSyncCheckbox = integrationContainer.locator('input[type="checkbox"]').first();

    // Ensure autoSync is enabled
    if (!(await autoSyncCheckbox.isChecked())) {
      await autoSyncCheckbox.click();
      await page.waitForTimeout(500);
    }

    // Get the sync interval input field
    const syncIntervalInput = integrationContainer.locator('input[type="number"]');

    // Verify it exists and is visible
    expect(await syncIntervalInput.count()).toBeGreaterThan(0);

    // Get the current value
    const currentValue = parseInt(
      (await syncIntervalInput.inputValue()) || "0",
      10
    );
    expect(currentValue).toBeGreaterThan(0);

    // Try to change the interval value
    const newValue = currentValue === 5 ? 10 : 5;
    await syncIntervalInput.fill(newValue.toString());
    await page.waitForTimeout(500);

    // Verify the value changed
    const updatedValue = parseInt(
      (await syncIntervalInput.inputValue()) || "0",
      10
    );
    expect(updatedValue).toBe(newValue);

    // Save settings
    const saveButton = page.locator('button:has-text("Save")');
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(1000);
    }

    // Reload and verify the new value persisted
    await page.reload();
    await page.waitForSelector('text="Integration Settings"', { timeout: 5000 });

    const googleCalendarSectionAfterReload = page
      .locator('text="Google Calendar"')
      .first();
    const reloadedContainer = googleCalendarSectionAfterReload
      .locator("..")
      .locator("..");
    const reloadedIntervalInput = reloadedContainer.locator('input[type="number"]');

    const persistedValue = parseInt(
      (await reloadedIntervalInput.inputValue()) || "0",
      10
    );
    expect(persistedValue).toBe(newValue);
  });

  test("autoSync interval field is hidden when autoSync is disabled", async ({ page }) => {
    // Navigate to settings
    await page.goto("http://localhost:3001/settings");

    // Wait for Integration Settings
    await page.waitForSelector('text="Integration Settings"', { timeout: 5000 });

    // Get the Google Calendar section
    const googleCalendarSection = page.locator('text="Google Calendar"').first();
    const integrationContainer = googleCalendarSection.locator("..").locator("..");

    // Get the autoSync checkbox
    const autoSyncCheckbox = integrationContainer.locator('input[type="checkbox"]').first();

    // Ensure autoSync is disabled
    if (await autoSyncCheckbox.isChecked()) {
      await autoSyncCheckbox.click();
      await page.waitForTimeout(500);
    }

    // The sync interval input should not be visible when autoSync is disabled
    const syncIntervalInput = integrationContainer.locator('input[type="number"]');

    // It should either not exist or be hidden
    const count = await syncIntervalInput.count();
    // Check if it's hidden or doesn't exist
    if (count > 0) {
      // If element exists, verify it's not visible
      expect(await syncIntervalInput.isVisible()).toBe(false);
    }
  });
});

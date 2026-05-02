import { test, expect } from "@playwright/test";

test.describe("Bug 2: Scheduler respects work hours and energy preferences", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto("http://localhost:3001");

    // Try to log in with test credentials (created in previous session)
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "testpassword123");
    await page.click('button:has-text("Sign in")');

    // Wait for redirect to dashboard
    await page.waitForURL("**/calendar", { timeout: 10000 });
  });

  test("scheduler keeps tasks within work hours", async ({ page }) => {
    // Navigate to settings
    await page.goto("http://localhost:3001/settings");

    // Find Auto-Schedule Settings section
    await page.waitForSelector('text="Auto-Schedule Settings"');

    // Set work hours to 09:00–15:00 (9 AM to 3 PM)
    // Work hours start
    await page.click('label:has-text("Start Time") + div select');
    await page.waitForSelector('text="9:00 AM"');
    await page.click('text="9:00 AM"');

    // Work hours end
    await page.click('label:has-text("End Time") + div select');
    await page.waitForSelector('text="3:00 PM"');
    await page.click('text="3:00 PM"');

    // Set energy windows
    // High energy: 9 AM–12 PM
    await page.click('text="High Energy Hours"');
    const highStart = page.locator('label:has-text("High Energy Hours")').locator('..').nth(1).locator('select').first();
    await highStart.click();
    await page.click('text="9:00 AM"');

    const highEnd = page.locator('label:has-text("High Energy Hours")').locator('..').nth(1).locator('select').nth(1);
    await highEnd.click();
    await page.click('text="12:00 PM"');

    // Navigate to tasks
    await page.goto("http://localhost:3001/tasks");

    // Create 5 test tasks with different energy levels
    const taskNames = [
      "High energy task 1",
      "High energy task 2",
      "Medium energy task 1",
      "Low energy task 1",
      "No energy preference task",
    ];

    for (const taskName of taskNames) {
      await page.click('button:has-text("Add Task")');
      await page.fill('input[placeholder*="Task name"]', taskName);
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(500);
    }

    // Trigger auto-schedule
    await page.click('button:has-text("Auto-Schedule")');
    await page.waitForSelector('[data-testid="schedule-complete"]', { timeout: 10000 });

    // Verify all scheduled tasks are within work hours (9 AM–3 PM / 09:00–15:00)
    const scheduledTasks = await page.locator('[data-testid="scheduled-task"]').all();

    for (const task of scheduledTasks) {
      const timeText = await task.locator('[data-testid="task-time"]').textContent();
      expect(timeText).toMatch(/^(9|10|11|12|1|2):00\s*(AM|PM)$/);

      // Verify time is between 9 AM and 3 PM
      const hour = parseInt(timeText?.split(":")[0] || "0");
      const period = timeText?.includes("PM") ? "PM" : "AM";
      const hourIn24 = period === "PM" && hour !== 12 ? hour + 12 : hour === 12 && period === "AM" ? 0 : hour;

      expect(hourIn24).toBeGreaterThanOrEqual(9);
      expect(hourIn24).toBeLessThan(15);
    }
  });

  test("tasks are scheduled according to energy level preference", async ({ page }) => {
    // Navigate to settings and set energy windows
    await page.goto("http://localhost:3001/settings");
    await page.waitForSelector('text="Auto-Schedule Settings"');

    // High energy: 9 AM–12 PM
    // Low energy: 1 PM–3 PM

    // Create a high-energy task
    await page.goto("http://localhost:3001/tasks");
    await page.click('button:has-text("Add Task")');
    await page.fill('input[placeholder*="Task name"]', "Focus work");
    await page.selectOption('select[name="energyLevel"]', "high");
    await page.click('button:has-text("Create")');

    // Create a low-energy task
    await page.click('button:has-text("Add Task")');
    await page.fill('input[placeholder*="Task name"]', "Admin work");
    await page.selectOption('select[name="energyLevel"]', "low");
    await page.click('button:has-text("Create")');

    // Auto-schedule
    await page.click('button:has-text("Auto-Schedule")');
    await page.waitForSelector('[data-testid="schedule-complete"]', { timeout: 10000 });

    // Verify high-energy task scheduled in high-energy hours
    const focusWork = await page.locator('text="Focus work"').first();
    const focusTime = await focusWork.locator('[data-testid="task-time"]').textContent();
    expect(focusTime).toMatch(/^(9|10|11):00 AM$/);

    // Verify low-energy task scheduled in low-energy hours
    const adminWork = await page.locator('text="Admin work"').first();
    const adminTime = await adminWork.locator('[data-testid="task-time"]').textContent();
    expect(adminTime).toMatch(/^(1|2):00 PM$/);
  });
});

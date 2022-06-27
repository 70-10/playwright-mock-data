import { expect, test } from "@playwright/test";
import { join } from "path";
import sinon from "sinon";

declare global {
  interface Window {
    __clock: sinon.SinonFakeTimers;
    sinon: sinon;
  }
}

test.beforeEach(async ({ context, page }) => {
  await context.addInitScript({
    path: join(__dirname, "..", "./node_modules/sinon/pkg/sinon.js"),
  });

  await page.goto("https://example.com");
  await page.evaluate(() => {
    window.__clock = window.sinon.useFakeTimers();
  });
});

test("fake time test", async ({ page }) => {
  // Implement a small time on the page
  await page.setContent(`
    <h1>UTC Time: <x-time></x-time></h1>
    <script>
      const time = document.querySelector('x-time');
      (function renderLoop() {
        const date = new Date();
        time.textContent = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
          .map(number => String(number).padStart(2, '0'))
          .join(':');
        setTimeout(renderLoop, 1000);
      })();
    </script>
  `);

  // Ensure controlled time
  await expect(page.locator("x-time")).toHaveText("00:00:00");
  await page.evaluate(() => window.__clock.tick(2000));
  await expect(page.locator("x-time")).toHaveText("00:00:02");
});

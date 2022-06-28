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
      function formatDate (date, format) {
        format = format.replace(/yyyy/g, date.getFullYear());
        format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
        format = format.replace(/dd/g, ('0' + date.getDate()).slice(-2));
        format = format.replace(/HH/g, ('0' + date.getHours()).slice(-2));
        format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
        format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
        format = format.replace(/SSS/g, ('00' + date.getMilliseconds()).slice(-3));
        return format;
      };
      const time = document.querySelector('x-time');
      (function renderLoop() {
        const date = new Date();
        time.textContent = formatDate(date, "yyyy/MM/dd HH:mm:ss")
        setTimeout(renderLoop, 1000);
      })();
    </script>
  `);

  // Ensure controlled time
  await expect(page.locator("x-time")).toHaveText("1970/01/01 09:00:00");
  await page.evaluate(() => window.__clock.tick(24 * 60 * 60 * 1000));
  await expect(page.locator("x-time")).toHaveText("1970/01/02 09:00:00");
});

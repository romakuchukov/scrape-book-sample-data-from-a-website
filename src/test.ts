import fs from "fs";
import { chromium, Frame } from "playwright";

const url = new URL(
  "https://odcom-69a2f5f05adbd3cd6ee6b80e9fbf1a2f.read.overdrive.com/"
);
const FILE = `${url.hostname}.json`;

console.log("Starting the scraping process...");

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto(url.origin);

const redirecturl = await page
  .locator("#sample-holder")
  .getAttribute("data-redirecturl");

let response = await page.goto(redirecturl);
const { src } = await response.json();

await page.goto(src);

const frameContent = await page
  .locator(".chapter-bar-next-button", { has: page.locator("span") })
  .evaluate((element: HTMLElement) => {
    return new Promise((resolve) => {
      let counter = 0;
      const content = [];
      const len = document.querySelectorAll("#spool .sheet").length;
      const intervalId = setInterval(async () => {
        element.click();
        content.push(
          document.querySelector("iframe").contentWindow.document.body
            .textContent
        );

        if (counter > len) {
          clearInterval(intervalId);
          resolve(content);
        }
        counter++;
      }, 1000);
    });
  });

console.log("Writing to file then exiting...");
fs.writeFileSync(FILE, JSON.stringify(frameContent));

await browser.close();

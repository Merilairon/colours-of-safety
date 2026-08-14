import { Before, After, setDefaultTimeout } from "@cucumber/cucumber";

setDefaultTimeout(60 * 1000);
import { Builder } from "selenium-webdriver";
import { Options as ChromeOptions } from "selenium-webdriver/chrome";
import dotenv from "dotenv";
import { World } from "./world";

dotenv.config({ override: true });

Before(async function (this: World) {
  const port = process.env.FRONTEND_PORT || "8080";
  this.baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

  const options = new ChromeOptions();
  options.addArguments(
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--window-size=1280,720",
  );
  if (process.env.HEADLESS === "true" || process.env.HEADLESS === "1") {
    options.addArguments("--headless=new");
  }

  this.driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
  await this.driver.manage().setTimeouts({ implicit: 10000 });
});

After(async function (this: World) {
  if (this.driver) {
    await this.driver.quit();
  }
});

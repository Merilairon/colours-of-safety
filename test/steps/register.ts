import { Given, When, Then } from "@cucumber/cucumber";
import assert from "assert";
import { randomUUID } from "crypto";
import { World } from "../support/world";
import { RegisterPage } from "../pages/RegisterPage";
import { MapPage } from "../pages/MapPage";

Given("I open the register page", async function (this: World) {
  const page = new RegisterPage(this.driver, this.baseUrl);
  await page.open();
});

When(
  "I enter display name {string}, email {string} and password {string}",
  async function (this: World, name: string, email: string, password: string) {
    if (email.includes("{random}")) {
      email = email.replace("{random}", randomUUID().split("-")[0]);
    }
    const page = new RegisterPage(this.driver, this.baseUrl);
    await page.open();
    await page.enterNameEmailPassword(name, email, password);
  },
);

When("I submit the registration form", async function (this: World) {
  const page = new RegisterPage(this.driver, this.baseUrl);
  await page.open();
  await page.submit();
});

Then("I am redirected to the map", async function (this: World) {
  const page = new MapPage(this.driver, this.baseUrl);
  assert.ok((await page.isMapVisible()) || (await page.isWelcomeHintVisible()));
});

Then("I am still on the register page", async function (this: World) {
  const url = await this.driver.getCurrentUrl();
  assert.ok(url.startsWith(this.baseUrl + "/register"));
});

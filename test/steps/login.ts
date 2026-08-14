import { Given, When, Then } from "@cucumber/cucumber";
import assert from "assert";
import { World } from "../support/world";
import { LoginPage } from "../pages/LoginPage";

Given("I open the login page", async function (this: World) {
  const page = new LoginPage(this.driver, this.baseUrl);
  await page.open();
});

Then("I see the {string} heading", async function (this: World, text: string) {
  const page = new LoginPage(this.driver, this.baseUrl);
  await page.open();
  const heading = await page.headingText();
  assert.strictEqual(heading, text);
});

When(
  "I enter email {string} and password {string}",
  async function (this: World, email: string, password: string) {
    const page = new LoginPage(this.driver, this.baseUrl);
    await page.open();
    await page.enterEmail(email);
    await page.enterPassword(password);
  },
);

When("I submit the form", async function (this: World) {
  const page = new LoginPage(this.driver, this.baseUrl);
  await page.open();
  await page.submit();
});

import { Given, Then } from "@cucumber/cucumber";
import assert from "assert";
import { World } from "../support/world";
import { AdminPage } from "../pages/AdminPage";

Given("I open the admin panel", async function (this: World) {
  const page = new AdminPage(this.driver, this.baseUrl);
  await page.open();
});

Then("I see a list of users", async function (this: World) {
  assert.ok((await new AdminPage(this.driver, this.baseUrl).userCount()) > 0);
});

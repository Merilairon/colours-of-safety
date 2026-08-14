import { Given, When, Then } from "@cucumber/cucumber";
import assert from "assert";
import { World } from "../support/world";
import { ProfilePage } from "../pages/ProfilePage";

Given("I open the profile page", async function (this: World) {
  const page = new ProfilePage(this.driver, this.baseUrl);
  await page.open();
});

When(
  "I change my display name to {string}",
  async function (this: World, name: string) {
    await new ProfilePage(this.driver, this.baseUrl).updateDisplayName(name);
  },
);

When("I save my profile", async function (this: World) {
  await new ProfilePage(this.driver, this.baseUrl).save();
});

Then("I see a success message", async function (this: World) {
  const msg = await new ProfilePage(this.driver, this.baseUrl).successMessage();
  assert.ok(msg.length > 0);
});

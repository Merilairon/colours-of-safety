import { Given, When, Then } from "@cucumber/cucumber";
import assert from "assert";
import { World } from "../support/world";
import { MapPage } from "../pages/MapPage";

Given("I open the map page", async function (this: World) {
  const page = new MapPage(this.driver, this.baseUrl);
  await page.open();
});

Then("I see the map", async function (this: World) {
  assert.ok(await new MapPage(this.driver, this.baseUrl).isMapVisible());
});

Then("I still see the map", async function (this: World) {
  assert.ok(await new MapPage(this.driver, this.baseUrl).isMapVisible());
});

Then("I see the legend", async function (this: World) {
  assert.ok(await new MapPage(this.driver, this.baseUrl).isLegendVisible());
});

Then("I see the social proof counter", async function (this: World) {
  assert.ok(
    await new MapPage(this.driver, this.baseUrl).isSocialProofVisible(),
  );
});

Then("I see the guest hint", async function (this: World) {
  assert.ok(await new MapPage(this.driver, this.baseUrl).isGuestHintVisible());
});

When(
  "I filter by category {string}",
  async function (this: World, category: string) {
    await new MapPage(this.driver, this.baseUrl).selectCategory(category);
  },
);

When(
  "I filter by minimum safety {string}",
  async function (this: World, label: string) {
    await new MapPage(this.driver, this.baseUrl).selectMinSafety(label);
  },
);

When("I search for {string}", async function (this: World, query: string) {
  await new MapPage(this.driver, this.baseUrl).searchFor(query);
});

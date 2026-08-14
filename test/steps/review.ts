import { Given } from "@cucumber/cucumber";
import { World } from "../support/world";
import { ReviewPage } from "../pages/ReviewPage";

Given("I open the review queue", async function (this: World) {
  const page = new ReviewPage(this.driver, this.baseUrl);
  await page.open();
});

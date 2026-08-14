import { Given } from "@cucumber/cucumber";
import { World } from "../support/world";
import { MySubmissionsPage } from "../pages/MySubmissionsPage";

Given("I open my submissions page", async function (this: World) {
  const page = new MySubmissionsPage(this.driver, this.baseUrl);
  await page.open();
});

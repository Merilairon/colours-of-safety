import { Given } from "@cucumber/cucumber";
import { randomUUID } from "crypto";
import { World } from "../support/world";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";

const roleDefaults: Record<string, { email: string; password: string }> = {
  reviewer: { email: "reviewer@coloursofsafety.com", password: "reviewer123" },
  admin: { email: "superadmin@coloursofsafety.com", password: "superadmin123" },
};

Given("a new registered user", async function (this: World) {
  const uid = randomUUID().split("-")[0];
  const name = `Tester ${uid}`;
  const email = `tester_${uid}@example.com`;
  const password = "TestPass123!";
  const page = new RegisterPage(this.driver, this.baseUrl);
  await page.open();
  await page.register(name, email, password);
  this.registeredUser = { name, email, password };
});

Given(
  /^I am logged in as (?:a |an )?(\w+)$/,
  async function (this: World, role: string) {
    const fallback = roleDefaults[role];
    const email =
      process.env[`${role.toUpperCase()}_EMAIL`] || fallback?.email || "";
    const password =
      process.env[`${role.toUpperCase()}_PASSWORD`] || fallback?.password || "";
    if (!email || !password) throw new Error(`Missing credentials for ${role}`);
    const page = new LoginPage(this.driver, this.baseUrl);
    await page.open();
    await page.login(email, password);
  },
);

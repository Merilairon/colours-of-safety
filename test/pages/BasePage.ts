import { WebDriver, By, until, WebElement } from "selenium-webdriver";
import { Select } from "selenium-webdriver/lib/select";

export class BasePage {
  driver: WebDriver;
  baseUrl: string;

  constructor(driver: WebDriver, baseUrl: string) {
    this.driver = driver;
    this.baseUrl = baseUrl;
  }

  async open(path = ""): Promise<this> {
    await this.driver.get(this.baseUrl + path);
    await this.dismissCookieConsent();
    return this;
  }

  async dismissCookieConsent(): Promise<void> {
    try {
      const btn = await this.driver.wait(
        until.elementLocated(By.css(".cookie-actions .cookie-btn.secondary")),
        10000,
      );
      await this.driver.wait(until.elementIsVisible(btn), 5000);
      await btn.click();
      await this.driver.wait(until.stalenessOf(btn), 10000);
    } catch {
      // already consented or banner not shown
    }
  }

  async find(by: By): Promise<WebElement> {
    return this.driver.wait(until.elementLocated(by), 10000);
  }

  async findAll(by: By): Promise<WebElement[]> {
    await this.driver.wait(until.elementLocated(by), 10000);
    return this.driver.findElements(by);
  }

  async click(by: By): Promise<WebElement> {
    const el = await this.find(by);
    await this.driver.wait(until.elementIsVisible(el), 10000);
    await el.click();
    return el;
  }

  async type(by: By, text: string): Promise<WebElement> {
    const el = await this.find(by);
    await el.clear();
    await el.sendKeys(text);
    return el;
  }

  async selectByText(by: By, text: string): Promise<WebElement> {
    const el = await this.find(by);
    const select = new Select(el);
    await select.selectByVisibleText(text);
    return el;
  }

  async isLoggedIn(): Promise<boolean> {
    const els = await this.driver.findElements(
      By.xpath("//button[contains(text(), 'Log out')]"),
    );
    return els.length > 0;
  }
}

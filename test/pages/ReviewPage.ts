import { WebDriver, By } from "selenium-webdriver";
import { BasePage } from "./BasePage";

export class ReviewPage extends BasePage {
  readonly path = "/review";

  private heading = By.css("h1");
  private filterAll = By.xpath("//button[contains(text(), 'All')]");
  private filterPlacesBtn = By.xpath("//button[contains(text(), 'Places')]");
  private filterDistricts = By.xpath("//button[contains(text(), 'Districts')]");
  private cards = By.css("ul.queue li.card");
  private approveBtn = By.css("li.card .actions button.approve");
  private rejectBtn = By.css("li.card .actions button.reject");

  async open(): Promise<this> {
    await super.open(this.path);
    return this;
  }

  async headingText(): Promise<string> {
    return (await this.find(this.heading)).getText();
  }

  async itemCount(): Promise<number> {
    return (await this.findAll(this.cards)).length;
  }

  async filterPlaces(): Promise<this> {
    await this.click(this.filterPlacesBtn);
    return this;
  }

  async approveFirst(): Promise<this> {
    const cards = await this.findAll(this.cards);
    if (cards.length === 0) throw new Error("No review items to approve");
    const btn = await cards[0].findElement(this.approveBtn);
    await btn.click();
    return this;
  }
}

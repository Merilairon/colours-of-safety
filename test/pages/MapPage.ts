import { WebDriver, By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

export class MapPage extends BasePage {
  readonly path = '/';

  private map = By.css(".map[role='application']");
  private searchInput = By.css("input[aria-label='Search city or address']");
  private searchButton = By.css("button[aria-label='Search']");
  private categorySelect = By.xpath("//label[contains(text(), 'Category')]/select");
  private minSafetySelect = By.xpath("//label[contains(text(), 'Min safety')]/select");
  private wheelchairCheckbox = By.xpath("//label[contains(text(), 'Wheelchair accessible')]//input[@type='checkbox']");
  private legend = By.css('.legend');
  private socialProof = By.css('.social-proof');
  private guestHint = By.xpath("//div[contains(@class, 'hint')]//a[@routerLink='/login']");
  private welcomeHint = By.css('.hint.welcome');
  private closeWelcome = By.css('button.close-hint');
  private toast = By.css('.toast');

  async open(): Promise<this> {
    await super.open(this.path);
    return this;
  }

  async isMapVisible(): Promise<boolean> {
    return (await this.find(this.map)).isDisplayed();
  }

  async isLegendVisible(): Promise<boolean> {
    return (await this.find(this.legend)).isDisplayed();
  }

  async isSocialProofVisible(): Promise<boolean> {
    return (await this.find(this.socialProof)).isDisplayed();
  }

  async isGuestHintVisible(): Promise<boolean> {
    return (await this.driver.findElements(this.guestHint)).length > 0;
  }

  async isWelcomeHintVisible(): Promise<boolean> {
    return (await this.driver.findElements(this.welcomeHint)).length > 0;
  }

  async closeWelcomeHint(): Promise<this> {
    if (await this.isWelcomeHintVisible()) {
      await this.click(this.closeWelcome);
    }
    return this;
  }

  async searchFor(query: string): Promise<this> {
    await this.type(this.searchInput, query);
    await this.click(this.searchButton);
    return this;
  }

  async selectCategory(category: string): Promise<this> {
    await this.selectByText(this.categorySelect, category);
    return this;
  }

  async selectMinSafety(label: string): Promise<this> {
    await this.selectByText(this.minSafetySelect, label);
    return this;
  }

  async enableWheelchairFilter(): Promise<this> {
    const el = await this.find(this.wheelchairCheckbox);
    if (!(await el.isSelected())) {
      await el.click();
    }
    return this;
  }

  async hasToast(message: string): Promise<boolean> {
    const toasts = await this.driver.findElements(this.toast);
    for (const t of toasts) {
      const text = await t.getText();
      if (text.includes(message)) return true;
    }
    return false;
  }
}

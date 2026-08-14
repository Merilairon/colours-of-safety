import { WebDriver, By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  readonly path = '/profile';

  private displayName = By.css("input[formControlName='displayName']");
  private saveProfile = By.xpath("//button[contains(text(), 'Save profile')]");
  private success = By.css("[role='status']");

  async open(): Promise<this> {
    await super.open(this.path);
    return this;
  }

  async updateDisplayName(name: string): Promise<this> {
    await this.type(this.displayName, name);
    return this;
  }

  async save(): Promise<this> {
    await this.click(this.saveProfile);
    return this;
  }

  async successMessage(): Promise<string> {
    return (await this.find(this.success)).getText();
  }
}

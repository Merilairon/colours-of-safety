import { WebDriver, By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  readonly path = '/admin';

  private heading = By.css('h1');
  private search = By.css("input[aria-label='Search users']");
  private userCards = By.css('ul.user-list li.card');

  async open(): Promise<this> {
    await super.open(this.path);
    return this;
  }

  async headingText(): Promise<string> {
    return (await this.find(this.heading)).getText();
  }

  async searchUser(query: string): Promise<this> {
    await this.type(this.search, query);
    return this;
  }

  async userCount(): Promise<number> {
    return (await this.findAll(this.userCards)).length;
  }
}

import { WebDriver, By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

export class MySubmissionsPage extends BasePage {
  readonly path = '/mine';

  private heading = By.css('h1');
  private rows = By.css('ul.list li.row');

  async open(): Promise<this> {
    await super.open(this.path);
    return this;
  }

  async headingText(): Promise<string> {
    return (await this.find(this.heading)).getText();
  }

  async hasSubmissionNamed(name: string, status: string): Promise<boolean> {
    for (const row of await this.findAll(this.rows)) {
      const text = await row.getText();
      if (text.includes(name) && text.includes(status)) return true;
    }
    return false;
  }

  async submissionCount(): Promise<number> {
    return (await this.findAll(this.rows)).length;
  }
}

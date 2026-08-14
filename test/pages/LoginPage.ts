import { WebDriver, By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly path = '/login';

  private emailInput = By.css("input[type='email']");
  private passwordInput = By.css("input[type='password']");
  private submitButton = By.css("button[type='submit']");
  private heading = By.css('h1');
  private errorAlert = By.css("[role='alert']");

  async open(): Promise<this> {
    await super.open(this.path);
    return this;
  }

  async enterEmail(email: string): Promise<this> {
    await this.type(this.emailInput, email);
    return this;
  }

  async enterPassword(password: string): Promise<this> {
    await this.type(this.passwordInput, password);
    return this;
  }

  async submit(): Promise<this> {
    await this.click(this.submitButton);
    return this;
  }

  async login(email: string, password: string): Promise<this> {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.submit();
    return this;
  }

  async headingText(): Promise<string> {
    return (await this.find(this.heading)).getText();
  }

  async hasError(): Promise<boolean> {
    return (await this.driver.findElements(this.errorAlert)).length > 0;
  }
}

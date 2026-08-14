import { WebDriver, By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  readonly path = '/register';

  private nameInput = By.css("input[autocomplete='nickname']");
  private emailInput = By.css("input[type='email']");
  private passwordInput = By.css("input[type='password']");
  private submitButton = By.css("button[type='submit']");
  private heading = By.css('h1');
  private errorAlert = By.css("[role='alert']");

  async open(): Promise<this> {
    await super.open(this.path);
    return this;
  }

  async enterNameEmailPassword(name: string, email: string, password: string): Promise<this> {
    await this.type(this.nameInput, name);
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    return this;
  }

  async submit(): Promise<this> {
    await this.click(this.submitButton);
    return this;
  }

  async register(name: string, email: string, password: string): Promise<this> {
    await this.enterNameEmailPassword(name, email, password);
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

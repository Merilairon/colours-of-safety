import { Then } from '@cucumber/cucumber';
import assert from 'assert';
import { By } from 'selenium-webdriver';
import { World } from '../support/world';

Then('I see the heading {string}', async function (this: World, text: string) {
  const h1 = await this.driver.findElement(By.css('h1'));
  assert.strictEqual(await h1.getText(), text);
});

Then('I see an error', async function (this: World) {
  const alerts = await this.driver.findElements(By.css("[role='alert']"));
  assert.ok(alerts.length > 0, 'Expected error alert');
});

Then('I see an error message', async function (this: World) {
  const alerts = await this.driver.findElements(By.css("[role='alert']"));
  assert.ok(alerts.length > 0, 'Expected error alert');
});

import { setWorldConstructor } from "@cucumber/cucumber";
import { WebDriver } from "selenium-webdriver";

export interface World {
  driver: WebDriver;
  baseUrl: string;
  registeredUser?: { name: string; email: string; password: string };
  attach: unknown;
  parameters: unknown;
}

class CustomWorld implements World {
  driver!: WebDriver;
  baseUrl!: string;
  registeredUser?: { name: string; email: string; password: string };
  attach: unknown;
  parameters: unknown;

  constructor({ attach, parameters }: any) {
    this.attach = attach;
    this.parameters = parameters;
  }
}

setWorldConstructor(CustomWorld as any);

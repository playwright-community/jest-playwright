import fs from 'fs'
import rimraf from 'rimraf'
import playwright from 'playwright'
import { DIR, WS_ENDPOINT_PATH } from './constants'
import checkBrowserEnv from "./utils";

let browser;

export async function setup() {
  const browserType = process.env.BROWSER;
  checkBrowserEnv(browserType);
  console.log('Setup Playwright');
  const OPTIONS = { webSocket: true};
  browser = await playwright[browserType].launchBrowserApp(OPTIONS);
  // Instead, we expose the connection details via file system to be used in tests
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(WS_ENDPOINT_PATH, browser.wsEndpoint())
}

export async function teardown() {
  console.log('Teardown Playwright');
  await browser.close()
  rimraf.sync(DIR)
}

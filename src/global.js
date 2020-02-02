import fs from 'fs'
// eslint-disable-next-line import/no-extraneous-dependencies
import rimraf from 'rimraf'
import playwright from 'playwright'
import { DIR, WS_ENDPOINT_PATH } from './constants'
import { checkBrowserEnv, readConfig, getBrowserType } from './utils'

let browser

export async function setup() {
  const config = await readConfig()
  const browserType = getBrowserType(config)
  checkBrowserEnv(browserType)
  const { launchBrowserApp } = config
  browser = await playwright[browserType].launchBrowserApp(launchBrowserApp)
  // Instead, we expose the connection details via file system to be used in tests
  fs.mkdirSync(DIR, { recursive: true })
  fs.writeFileSync(WS_ENDPOINT_PATH, browser.wsEndpoint())
}

export async function teardown() {
  await browser.close()
  rimraf.sync(DIR)
}

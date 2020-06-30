import { Page, Browser, BrowserContext } from 'playwright-core'

interface JestPlaywright {
  /**
   * Reset global.page
   *
   * ```ts
   * it('should reset page', async () => {
   *   await jestPlaywright.resetPage()
   * })
   * ```
   */
  resetPage: () => Promise<void>
  /**
   * Reset global.browser, global.context, and global.page
   *
   * ```ts
   * it('should reset page', async () => {
   *   await jestPlaywright.resetBrowser()
   * })
   * ```
   */
  resetBrowser: () => Promise<void>
  /**
   * Suspends test execution and gives you opportunity to see what's going on in the browser
   * - Jest is suspended (no timeout)
   * - A debugger instruction to the Browser, if Playwright has been launched with { devtools: true } it will stop
   *
   * ```ts
   * it('should put test in debug mode', async () => {
   *   await jestPlaywright.debug()
   * })
   * ```
   */
  debug: () => Promise<void>
  /**
   * Saves the coverage to the disk which will only work if `collectCoverage`
   * in `jest-playwright.config.js` file is set to true. The merged coverage file
   * is then available in `.nyc_output/coverage.json`. Mostly its needed in the
   * `afterEach` handler like that:
   *
   * ```ts
   * afterEach(async () => {
   *   await jestPlaywright.saveCoverage(page)
   * })
   * ```
   */
  saveCoverage: (page: Page) => Promise<void>
}

declare global {
  const browserName: string
  const deviceName: string
  const page: Page
  const browser: Browser
  const context: BrowserContext
  const jestPlaywright: JestPlaywright
}

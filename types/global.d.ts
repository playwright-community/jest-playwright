import { Page, Browser, BrowserContext } from 'playwright-core';

interface JestPlaywright {
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
}

declare global {
  var page: Page;
  var browser: Browser
  var context: BrowserContext
  var jestPlaywright: JestPlaywright
}
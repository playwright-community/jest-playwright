import { Page, BrowserContext } from 'playwright-core'
import { BrowserType } from '../src/constants'

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
  const page: Page
  const browser: BrowserType
  const context: BrowserContext
  const jestPlaywright: JestPlaywright
}

/* eslint-disable no-console */
import type { Event, State } from 'jest-circus'
import type { Browser, Page } from 'playwright-core'
import type {
  JestPlaywrightConfig,
  GenericBrowser,
  BrowserType,
  JestPlaywrightJestConfig,
} from './types'
import { CHROMIUM, IMPORT_KIND_PLAYWRIGHT } from './constants'
import {
  getBrowserType,
  getDeviceType,
  getPlaywrightInstance,
  readConfig,
} from './utils'
import { savePageCoverage } from './coverage'

const handleError = (error: Error): void => {
  process.emit('uncaughtException', error)
}

const KEYS = {
  CONTROL_C: '\u0003',
  CONTROL_D: '\u0004',
  ENTER: '\r',
}

const getBrowserPerProcess = async (
  playwrightInstance: GenericBrowser,
  browserType: BrowserType,
  config: JestPlaywrightConfig,
): Promise<Browser> => {
  const { launchOptions, connectOptions } = config
  // https://github.com/mmarkelov/jest-playwright/issues/42#issuecomment-589170220
  if (browserType !== CHROMIUM && launchOptions && launchOptions.args) {
    launchOptions.args = launchOptions.args.filter(
      (item: string) => item !== '--no-sandbox',
    )
  }

  if (connectOptions) {
    return playwrightInstance.connect(connectOptions)
  } else {
    return playwrightInstance.launch(launchOptions)
  }
}

export const getPlaywrightEnv = (basicEnv = 'node') => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RootEnv = require(basicEnv === 'node'
    ? 'jest-environment-node'
    : 'jest-environment-jsdom')

  return class PlaywrightEnvironment extends RootEnv {
    readonly _config: JestPlaywrightJestConfig

    constructor(config: JestPlaywrightJestConfig) {
      super(config)
      this._config = config
    }

    async setup(): Promise<void> {
      const { rootDir, wsEndpoint, browserName } = this._config
      const config = await readConfig(rootDir)
      config.connectOptions = { wsEndpoint }
      const browserType = getBrowserType(browserName)
      const { exitOnPageError, selectors } = config
      let { contextOptions } = config
      const device = getDeviceType(this._config.device)
      const {
        name,
        instance: playwrightInstance,
        devices,
      } = getPlaywrightInstance(browserType)

      if (name === IMPORT_KIND_PLAYWRIGHT) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const playwright = require('playwright')
        if (selectors) {
          await Promise.all(
            selectors.map(({ name, script }) => {
              return playwright.selectors.register(name, script)
            }),
          )
        }
      }

      if (device) {
        const { viewport, userAgent } = devices[device]
        contextOptions = { viewport, userAgent, ...contextOptions }
      }
      this.global.browserName = browserType
      this.global.deviceName = device
      this.global.browser = await getBrowserPerProcess(
        playwrightInstance,
        browserType,
        config,
      )
      this.global.context = await this.global.browser.newContext(contextOptions)
      this.global.page = await this.global.context.newPage()
      if (exitOnPageError) {
        this.global.page.on('pageerror', handleError)
      }
      this.global.jestPlaywright = {
        debug: async (): Promise<void> => {
          // Run a debugger (in case Playwright has been launched with `{ devtools: true }`)
          await this.global.page.evaluate(() => {
            // eslint-disable-next-line no-debugger
            debugger
          })
          // eslint-disable-next-line no-console
          console.log('\n\n🕵️‍  Code is paused, press enter to resume')
          // Run an infinite promise
          return new Promise((resolve) => {
            const { stdin } = process
            const listening = stdin.listenerCount('data') > 0
            const onKeyPress = (key: string): void => {
              if (
                key === KEYS.CONTROL_C ||
                key === KEYS.CONTROL_D ||
                key === KEYS.ENTER
              ) {
                stdin.removeListener('data', onKeyPress)
                if (!listening) {
                  if (stdin.isTTY) {
                    stdin.setRawMode(false)
                  }
                  stdin.pause()
                }
                resolve()
              }
            }
            if (!listening) {
              if (stdin.isTTY) {
                stdin.setRawMode(true)
              }
              stdin.resume()
              stdin.setEncoding('utf8')
            }
            stdin.on('data', onKeyPress)
          })
        },
        saveCoverage: async (page: Page): Promise<void> =>
          savePageCoverage(page, config.collectCoverage),
      }
    }

    async handleTestEvent(event: Event, state: State): Promise<void> {
      // Hack to set testTimeout for jestPlaywright debugging
      if (
        event.name === 'add_test' &&
        event.fn &&
        event.fn.toString().includes('jestPlaywright.debug()')
      ) {
        // Set timeout to 4 days
        state.testTimeout = 4 * 24 * 60 * 60 * 1000
      }
    }

    async teardown(): Promise<void> {
      const { page, browser } = this.global
      if (page) {
        page.removeListener('pageerror', handleError)
      }

      if (browser) {
        await browser.close()
      }

      await super.teardown()
    }
  }
}

export default getPlaywrightEnv()

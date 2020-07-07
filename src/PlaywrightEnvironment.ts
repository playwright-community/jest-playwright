/* eslint-disable no-console */
import type { Event, State } from 'jest-circus'
import type { Browser, Page, BrowserContext } from 'playwright-core'
import type {
  JestPlaywrightConfig,
  GenericBrowser,
  BrowserType,
  JestPlaywrightJestConfig,
  SkipOption,
} from './types'
import {
  CHROMIUM,
  IMPORT_KIND_PLAYWRIGHT,
  LAUNCH,
  PERSISTENT,
} from './constants'
import {
  getBrowserOptions,
  getBrowserType,
  getDeviceType,
  getPlaywrightInstance,
  getSkipFlag,
  readConfig,
} from './utils'
import { saveCoverageOnPage, saveCoverageToFile } from './coverage'

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
): Promise<Browser | BrowserContext> => {
  const { launchType, userDataDir, launchOptions, connectOptions } = config

  if (launchType === LAUNCH || launchType === PERSISTENT) {
    // https://github.com/mmarkelov/jest-playwright/issues/42#issuecomment-589170220
    if (browserType !== CHROMIUM && launchOptions && launchOptions.args) {
      launchOptions.args = launchOptions.args.filter(
        (item: string) => item !== '--no-sandbox',
      )
    }

    const options = getBrowserOptions(browserType, launchOptions)

    if (launchType === LAUNCH) {
      return playwrightInstance.launch(options)
    }

    if (launchType === PERSISTENT) {
      // @ts-ignore
      return playwrightInstance.launchPersistentContext(userDataDir!, options)
    }
  }

  const options = getBrowserOptions(browserType, connectOptions)
  return playwrightInstance.connect(options)
}

export const getPlaywrightEnv = (basicEnv = 'node'): unknown => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RootEnv = require(basicEnv === 'node'
    ? 'jest-environment-node'
    : 'jest-environment-jsdom')

  return class PlaywrightEnvironment extends RootEnv {
    readonly _config: JestPlaywrightJestConfig
    _jestPlaywrightConfig!: JestPlaywrightConfig

    constructor(config: JestPlaywrightJestConfig) {
      super(config)
      this._config = config
    }

    async setup(): Promise<void> {
      const { rootDir, wsEndpoint, browserName } = this._config
      this._jestPlaywrightConfig = await readConfig(rootDir)
      if (
        wsEndpoint &&
        !this._jestPlaywrightConfig.connectOptions?.wsEndpoint
      ) {
        this._jestPlaywrightConfig.connectOptions!.wsEndpoint = wsEndpoint
      }
      const browserType = getBrowserType(browserName)
      const {
        exitOnPageError,
        selectors,
        collectCoverage,
        launchType,
      } = this._jestPlaywrightConfig
      let contextOptions = getBrowserOptions(
        browserName,
        this._jestPlaywrightConfig.contextOptions,
      )
      const device = getDeviceType(this._config.device)
      let deviceName: string | null = null
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

      if (device != null) {
        if (typeof device === 'string') {
          deviceName = device
          contextOptions = { ...devices[device], ...contextOptions }
        } else {
          const { name, ...deviceProps } = device
          deviceName = name
          contextOptions = { ...deviceProps, ...contextOptions }
        }
      }
      this.global.browserName = browserType
      this.global.deviceName = deviceName
      this.global.browser =
        launchType === PERSISTENT
          ? null
          : await getBrowserPerProcess(
              playwrightInstance,
              browserType,
              this._jestPlaywrightConfig,
            )
      this.global.context =
        launchType === PERSISTENT
          ? await getBrowserPerProcess(
              playwrightInstance,
              browserType,
              this._jestPlaywrightConfig,
            )
          : await this.global.browser.newContext(contextOptions)
      if (collectCoverage) {
        ;(this.global.context as BrowserContext).exposeFunction(
          'reportCodeCoverage',
          saveCoverageToFile,
        )
        ;(this.global.context as BrowserContext).addInitScript(() =>
          window.addEventListener('beforeunload', () => {
            // @ts-ignore
            reportCodeCoverage(window.__coverage__)
          }),
        )
      }
      this.global.page = await this.global.context.newPage()
      if (exitOnPageError) {
        this.global.page.on('pageerror', handleError)
      }
      this.global.jestPlaywright = {
        skip: (skipOption: SkipOption, callback: () => void): void => {
          const skipFlag = getSkipFlag(skipOption, browserName, deviceName)
          const { describe, it, test } = this.global
          if (skipFlag) {
            this.global.describe = describe.skip
            this.global.it = it.skip
            this.global.test = test.skip
          }
          callback()
          this.global.describe = describe
          this.global.it = it
          this.global.test = test
        },
        resetPage: async (): Promise<void> => {
          const { context, page } = this.global
          if (page) {
            page.removeListener('pageerror', handleError)
            await page.close()
          }

          this.global.page = await context.newPage()
          if (exitOnPageError) {
            this.global.page.addListener('pageerror', handleError)
          }
        },
        resetContext: async (): Promise<void> => {
          const { browser, context } = this.global

          if (context) {
            await context.close()
          }

          this.global.context = await browser.newContext(contextOptions)

          await this.global.jestPlaywright.resetPage()
        },
        resetBrowser: async (): Promise<void> => {
          const { browser } = this.global

          if (browser) {
            await browser.close()
          }

          this.global.browser = await getBrowserPerProcess(
            playwrightInstance,
            browserType,
            this._jestPlaywrightConfig,
          )

          this.global.context = await this.global.browser.newContext(
            contextOptions,
          )

          await this.global.jestPlaywright.resetPage()
        },
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
          saveCoverageOnPage(page, this._jestPlaywrightConfig.collectCoverage),
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
      const { browser, context, page } = this.global
      const { collectCoverage } = this._jestPlaywrightConfig
      if (page) {
        page.removeListener('pageerror', handleError)
      }
      if (collectCoverage) {
        await Promise.all(
          (context as BrowserContext).pages().map((p) =>
            p.close({
              runBeforeUnload: true,
            }),
          ),
        )
        // wait until coverage data was sent successfully to the exposed function
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      if (browser) {
        await browser.close()
      }

      await super.teardown()
    }
  }
}

export default getPlaywrightEnv()

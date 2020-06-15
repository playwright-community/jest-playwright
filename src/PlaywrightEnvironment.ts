/* eslint-disable no-console */
import type { Config as JestConfig } from '@jest/types'
import type { Event, State } from 'jest-circus'
import type { Browser } from 'playwright-core'
import type { Config, GenericBrowser, BrowserType } from './types'
import { CHROMIUM, IMPORT_KIND_PLAYWRIGHT } from './constants'
import {
  getBrowserType,
  getDeviceType,
  getPlaywrightInstance,
  readConfig,
  readPackage,
} from './utils'

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
  config: Config,
): Promise<Browser> => {
  const { launchBrowserApp, connectBrowserApp } = config
  // https://github.com/mmarkelov/jest-playwright/issues/42#issuecomment-589170220
  if (browserType !== CHROMIUM && launchBrowserApp && launchBrowserApp.args) {
    launchBrowserApp.args = launchBrowserApp.args.filter(
      (item: string) => item !== '--no-sandbox',
    )
  }

  if (connectBrowserApp) {
    return await playwrightInstance.connect(connectBrowserApp)
  } else {
    return await playwrightInstance.launch(launchBrowserApp)
  }
}

export const getPlaywrightEnv = (basicEnv = 'node') => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RootEnv = require(basicEnv === 'node'
    ? 'jest-environment-node'
    : 'jest-environment-jsdom')

  return class PlaywrightEnvironment extends RootEnv {
    private _config: JestConfig.ProjectConfig

    constructor(config: JestConfig.ProjectConfig) {
      super(config)
      this._config = config
    }

    async setup(): Promise<void> {
      const config = await readConfig(this._config.rootDir)
      //@ts-ignore
      config.connectBrowserApp = { wsEndpoint: this._config.wsEndpoint }
      //@ts-ignore
      const browserType = getBrowserType(this._config.browserName)
      const { context, exitOnPageError, selectors } = config
      const playwrightPackage = await readPackage()
      if (playwrightPackage === IMPORT_KIND_PLAYWRIGHT) {
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
      //@ts-ignore
      const device = getDeviceType(this._config.device)
      const { instance: playwrightInstance, devices } = getPlaywrightInstance(
        playwrightPackage,
        browserType,
      )
      let contextOptions = context

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

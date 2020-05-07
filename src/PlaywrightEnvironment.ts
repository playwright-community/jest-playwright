/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
import NodeEnvironment from 'jest-environment-node'
import { Config as JestConfig } from '@jest/types'
import {
  checkBrowserEnv,
  checkDeviceEnv,
  getDeviceType,
  getPlaywrightInstance,
  readConfig,
  readPackage,
} from './utils'
import {
  Config,
  CHROMIUM,
  GenericBrowser,
  IMPORT_KIND_PLAYWRIGHT,
  BrowserType,
} from './constants'
import playwright, { Browser } from 'playwright-core'

const handleError = (error: Error): void => {
  process.emit('uncaughtException', error)
}

const KEYS = {
  CONTROL_C: '\u0003',
  CONTROL_D: '\u0004',
  ENTER: '\r',
}

let teardownServer: (() => Promise<void>) | null = null

const logMessage = ({
  message,
  action,
}: {
  message: string
  action: string
}): void => {
  console.log('')
  console.error(message)
  console.error(`\n☝️ You ${action} in jest-playwright.config.js`)
  process.exit(1)
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
      (item) => item !== '--no-sandbox',
    )
  }

  if (connectBrowserApp) {
    return await playwrightInstance.connect(connectBrowserApp)
  } else {
    return await playwrightInstance.launch(launchBrowserApp)
  }
}

class PlaywrightEnvironment extends NodeEnvironment {
  private _config: JestConfig.ProjectConfig
  constructor(config: JestConfig.ProjectConfig) {
    super(config)
    this._config = config
  }

  async setup(): Promise<void> {
    const config = await readConfig(this._config.rootDir)
    //@ts-ignore
    const browserType: BrowserType = this._config.browserName
    checkBrowserEnv(browserType)
    const { context, exitOnPageError, server, selectors } = config
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
    const device = getDeviceType(config)
    const playwrightInstance = await getPlaywrightInstance(
      playwrightPackage,
      browserType,
    )
    let contextOptions = context

    if (server) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const devServer = require('jest-dev-server')
      const { setup, ERROR_TIMEOUT, ERROR_NO_COMMAND } = devServer
      teardownServer = devServer.teardown
      try {
        await setup(server)
      } catch (error) {
        if (error.code === ERROR_TIMEOUT) {
          logMessage({
            message: error.message,
            action: 'can set "server.launchTimeout"',
          })
        }
        if (error.code === ERROR_NO_COMMAND) {
          logMessage({
            message: error.message,
            action: 'must set "server.command"',
          })
        }
        throw error
      }
    }

    const availableDevices = Object.keys(playwright.devices)
    if (device) {
      checkDeviceEnv(device, availableDevices)
      const { viewport, userAgent } = playwright.devices[device]
      contextOptions = { viewport, userAgent, ...contextOptions }
    }
    this.global.browserName = browserType
    this.global.deviceName = config.device
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

  async teardown(jestConfig: JestConfig.InitialOptions = {}): Promise<void> {
    const { page, context, browser } = this.global
    if (page) {
      page.removeListener('pageerror', handleError)
    }
    if (context) {
      await context.close()
    }
    if (page) {
      await page.close()
    }

    if (browser) {
      await browser.close()
    }

    await super.teardown()

    if (!jestConfig.watch && !jestConfig.watchAll && teardownServer) {
      await teardownServer()
    }
  }
}

export default PlaywrightEnvironment

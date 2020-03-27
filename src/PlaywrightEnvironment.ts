/* eslint-disable no-console */
import NodeEnvironment from 'jest-environment-node'
import { Config as JestConfig } from '@jest/types'
import Expect = jest.Expect
import {
  Browser,
  BrowserContext,
  BrowserType as PlaywrightBrowserType,
  Page,
} from 'playwright'
import { DeviceDescriptors } from 'playwright-core/lib/deviceDescriptors'

import {
  checkBrowserEnv,
  checkDeviceEnv,
  getBrowserType,
  getDeviceType,
  getPlaywrightInstance,
  readConfig,
} from './utils'
import {
  Config,
  CHROMIUM,
  BrowserType,
  Initializer,
  InitializerProps,
  Args,
  RootProxy,
} from './constants'
import { DeviceDescriptors } from 'playwright-core/lib/deviceDescriptors'

const handleError = (error: Error): void => {
  process.emit('uncaughtException', error)
}

const KEYS = {
  CONTROL_C: '\u0003',
  CONTROL_D: '\u0004',
  ENTER: '\r',
}

let teardownServer: (() => Promise<void>) | null = null
let browserPerProcess: Browser | null = null
let browserShutdownTimeout: NodeJS.Timeout | null = null

const resetBrowserCloseWatchdog = (): void => {
  if (browserShutdownTimeout) clearTimeout(browserShutdownTimeout)
}

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

// Since there are no per-worker hooks, we have to setup a timer to
// close the browser.
//
// @see https://github.com/facebook/jest/issues/8708 (and upvote plz!)
const startBrowserCloseWatchdog = (): void => {
  resetBrowserCloseWatchdog()
  browserShutdownTimeout = setTimeout(async () => {
    const browser = browserPerProcess
    browserPerProcess = null
    if (browser) await browser.close()
  }, 50)
}

const getBrowserPerProcess = async (
  playwrightInstance: PlaywrightBrowserType,
  config: Config,
): Promise<Browser> => {
  if (!browserPerProcess) {
    const browserType = getBrowserType(config)
    checkBrowserEnv(browserType)
    const { launchBrowserApp } = config
    // https://github.com/mmarkelov/jest-playwright/issues/42#issuecomment-589170220
    if (browserType !== CHROMIUM && launchBrowserApp && launchBrowserApp.args) {
      launchBrowserApp.args = launchBrowserApp.args.filter(
        (item) => item !== '--no-sandbox',
      )
    }
    browserPerProcess = await playwrightInstance.launch(launchBrowserApp)
  }
  return browserPerProcess
}

class PlaywrightEnvironment extends NodeEnvironment {
  private _config: JestConfig.ProjectConfig
  constructor(config: JestConfig.ProjectConfig) {
    super(config)
    this._config = config
  }

  async setup(): Promise<void> {
    resetBrowserCloseWatchdog()
    const config = await readConfig(this._config.rootDir)
    const { context, server, selectors, browsers, devices } = config
    // Two possible cases
    // browsers are defined
    if (browsers && browsers.length) {
      // Playwright instances for each browser
      const playwrightInstances = await Promise.all(
        browsers.map((browser) => getPlaywrightInstance(browser, selectors)),
      )

      // Helpers
      const getResult = <T>(
        data: T[],
        instances: BrowserType[] | Array<keyof typeof DeviceDescriptors>,
      ) => {
        const result: any = {}
        data.forEach((item: T, index: number) => {
          result[instances[index]] = item
        })
        return result
      }

      const initialize = async <T>(
        browser: BrowserType,
        initializer: Initializer,
      ): Promise<T> => {
        if (devices && devices.length) {
          return await Promise.all(
            devices.map((device) => initializer({ browser, device })),
          ).then((data) => getResult<T>(data, devices))
        } else {
          return initializer({ browser })
        }
      }

      // Browsers
      const playwrightBrowsers = await Promise.all(
        browsers.map((browser, index) =>
          getBrowserPerProcess(playwrightInstances[index], {
            ...config,
            browser,
          }),
        ),
      ).then((data) => getResult(data, browsers))

      // Contexts
      const contextInitializer = ({
        browser,
        device,
      }: InitializerProps): Promise<BrowserContext> => {
        let contextOptions = {}
        if (device) {
          const { viewport, userAgent } = DeviceDescriptors[device]
          contextOptions = { viewport, userAgent }
        }
        return playwrightBrowsers[browser].newContext(contextOptions)
      }

      const contexts = await Promise.all(
        browsers.map((browser) => initialize(browser, contextInitializer)),
      ).then((data) => getResult(data, browsers))

      // Pages
      const pageInitializer = ({
        browser,
        device,
      }: InitializerProps): Promise<Page> => {
        const instance = contexts[browser]
        return device ? instance[device].newPage() : instance.newPage()
      }

      const pages = await Promise.all(
        browsers.map((browser) => initialize<Page>(browser, pageInitializer)),
      ).then((data) => getResult(data, browsers))

      const checker = <T>({
        instance,
        key,
        args,
      }: {
        instance: any
        key: keyof T
        args: Args
      }) => {
        if (typeof instance[key] === 'function') {
          return ((instance[key] as unknown) as Function).call(
            instance,
            ...args,
          )
        } else {
          return instance[key]
        }
      }

      // TODO Improve types
      const callAsync = async <T>(
        instances: RootProxy,
        key: keyof T,
        ...args: Args
      ) =>
        await Promise.all(
          browsers.map(async (browser) => {
            const browserInstance: {
              [key: string]: T
            } = instances[browser]
            if (devices && devices.length) {
              return await Promise.all(
                devices.map((device) => {
                  const instance = browserInstance[device]
                  return checker<T>({ instance, key, args })
                }),
              ).then((data) => getResult(data, devices))
            } else {
              return checker<T>({ instance: browserInstance, key, args })
            }
          }),
        ).then((data) => getResult(data, browsers))

      const proxyWrapper = <T>(instances: RootProxy) =>
        new Proxy(
          {},
          {
            get: (obj, key) => {
              const browser = browsers.find((item) => item === key)
              if (browser) {
                return instances[browser]
              } else {
                return (...args: Args) =>
                  callAsync<T>(instances, key as keyof T, ...args)
              }
            },
          },
        )

      const testRunner = ({
        expectFunction,
        errorMessage,
      }: {
        expectFunction: Expect
        errorMessage: string
      }) => {
        try {
          return expectFunction
        } catch (e) {
          // TODO Think about error message
          console.log(errorMessage)
          return expectFunction
        }
      }

      this.global.browser = proxyWrapper<Browser>(playwrightBrowsers)
      this.global.context = proxyWrapper<BrowserContext>(contexts)
      this.global.page = proxyWrapper<Page>(pages)
      // TODO Types
      // TODO Add expectWebkit, expectFirefox?
      this.global.expectAllBrowsers = (input: any) =>
        new Proxy(
          {},
          {
            get: (obj, key) => {
              const { expect } = this.global
              return (...args: Args) => {
                browsers.forEach((browser) => {
                  if (devices && devices.length) {
                    devices.forEach((device) => {
                      const expectFunction = expect(input[browser][device])[
                        key
                      ](...args)
                      const errorMessage = `Failed test for ${browser}, ${device}`
                      testRunner({ expectFunction, errorMessage })
                    })
                  } else {
                    const expectFunction = expect(input[browser])[key](...args)
                    const errorMessage = `Failed test for ${browser}`
                    testRunner({ expectFunction, errorMessage })
                  }
                })
              }
            },
          },
        )
    } else {
      // Browsers are not defined
      const browserType = getBrowserType(config)
      checkBrowserEnv(browserType)
      const device = getDeviceType(config)
      const playwrightInstance = await getPlaywrightInstance(
        browserType,
        selectors,
      )
      let contextOptions = context
      const availableDevices = Object.keys(DeviceDescriptors)
      if (device) {
        checkDeviceEnv(device, availableDevices)
        const { viewport, userAgent } = DeviceDescriptors[device]
        contextOptions = { viewport, userAgent, ...contextOptions }
      }
      this.global.browser = await getBrowserPerProcess(
        playwrightInstance,
        config,
      )
      this.global.context = await this.global.browser.newContext(contextOptions)
      this.global.page = await this.global.context.newPage()
    }

    this.global.page.on('pageerror', handleError)

    if (server) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const devServer = require('jest-dev-server')
      const { setup, ERROR_TIMEOUT, ERROR_NO_COMMAND } = devServer
      teardownServer = devServer.teardown
      try {
        await setup(config.server)
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
    await super.teardown()
    if (!jestConfig.watch && !jestConfig.watchAll && teardownServer) {
      await teardownServer()
    }
    const { page } = this.global
    if (page) {
      page.removeListener('pageerror', handleError)
      await page.close()
    }
    startBrowserCloseWatchdog()
  }
}

export default PlaywrightEnvironment

/* eslint-disable no-console */
// TODO Replace
/* eslint-disable @typescript-eslint/ban-ts-ignore */
import NodeEnvironment from 'jest-environment-node'
import { Config as JestConfig } from '@jest/types'
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
import { Config, CHROMIUM, BrowserType } from './constants'

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
        item => item !== '--no-sandbox',
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
        browsers.map(browser => getPlaywrightInstance(browser, selectors)),
      )

      // Utils
      type InitializerProps = {
        browser: BrowserType
        device: string
      }

      type RootProxy = {
        [key: string]: any
      }

      type Initializer = (args: InitializerProps) => void

      const getResult = (data: any, instances: any) => {
        const result = {}
        data.forEach((item: any, index: string) => {
          // @ts-ignore
          result[instances[index]] = item
        })
        return result
      }

      const initialize = async (
        browser: BrowserType,
        initializer: Initializer,
      ) => {
        if (devices && devices.length) {
          return await Promise.all(
            devices.map(device => initializer({ browser, device })),
          ).then(data => getResult(data, devices))
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
      ).then(data => getResult(data, browsers))

      // Contexts
      const contextInitializer = ({ browser, device }: InitializerProps) =>
        // @ts-ignore
        playwrightBrowsers[browser].newContext(DeviceDescriptors[device])

      const contexts = await Promise.all(
        browsers.map(browser => initialize(browser, contextInitializer)),
      ).then(data => getResult(data, browsers))

      // Pages
      const pageInitializer = ({ browser, device }: InitializerProps) =>
        // @ts-ignore
        contexts[browser][device].newPage()

      const pages = await Promise.all(
        browsers.map(browser => initialize(browser, pageInitializer)),
      ).then(data => getResult(data, browsers))
      // TODO Improve types
      const callAsync = async <T>(
        instances: RootProxy,
        key: keyof T,
        ...args: any
      ) =>
        await Promise.all(
          browsers.map(async browser => {
            const browserInstance: T = instances[browser]
            if (devices && devices.length) {
              return await Promise.all(
                devices.map(device => {
                  // @ts-ignore
                  if (typeof browserInstance[device][key] === 'function') {
                    // @ts-ignore
                    return ((browserInstance[device][
                      key
                    ] as unknown) as Function).call(
                      // @ts-ignore
                      browserInstance[device],
                      ...args,
                    )
                  } else {
                    // @ts-ignore
                    return browserInstance[device][key]
                  }
                }),
              ).then(data => getResult(data, devices))
            }
          }),
        ).then(data => getResult(data, browsers))

      const proxyWrapper = <T>(instances: RootProxy) =>
        new Proxy(
          {},
          {
            get: (obj, key) => {
              const browser = browsers.find(item => item === key)
              if (browser) {
                return instances[browser]
              } else {
                return (...args: any) =>
                  callAsync<T>(instances, key as keyof T, ...args)
              }
            },
          },
        )

      this.global.browser = proxyWrapper<Browser>(playwrightBrowsers)
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      this.global.context = proxyWrapper<BrowserContext>(contexts)
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      this.global.page = proxyWrapper<Page>(pages)
      // TODO Types
      this.global.expectAllBrowsers = (input: any) =>
        new Proxy(
          {},
          {
            get: (obj, key) => {
              const expect = this.global.expect
              return (...args: any) => {
                browsers.forEach(browser => {
                  try {
                    return expect(input[browser])[key](...args)
                  } catch (e) {
                    // TODO Think about error message
                    console.log('Failed test for', browser)
                    return expect(input[browser])[key](...args)
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
      const availableDevices = Object.keys(playwrightInstance.devices)
      if (device) {
        checkDeviceEnv(device, availableDevices)
        const { viewport, userAgent } = playwrightInstance.devices[device]
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
        return new Promise(resolve => {
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
    if (this.global.page) {
      this.global.page.removeListener('pageerror', handleError)
      await this.global.page.close()
    }
    startBrowserCloseWatchdog()
  }
}

export default PlaywrightEnvironment

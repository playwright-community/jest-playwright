/* eslint-disable no-console, @typescript-eslint/no-unused-vars */
import type { Event, State } from 'jest-circus'
import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  Page,
} from 'playwright-core'
import type {
  BrowserType,
  ConfigDeviceType,
  ConfigParams,
  ConnectOptions,
  GenericBrowser,
  JestPlaywrightConfig,
  JestPlaywrightProjectConfig,
  Nullable,
  Playwright,
  TestPlaywrightConfigOptions,
} from '../types/global'
import {
  CHROMIUM,
  CONFIG_ENVIRONMENT_NAME,
  DEBUG_TIMEOUT,
  DEFAULT_CONFIG,
  FIREFOX,
  IMPORT_KIND_PLAYWRIGHT,
  PERSISTENT,
  LAUNCH,
} from './constants'
import {
  checkDevice,
  deepMerge,
  formatError,
  getBrowserOptions,
  getBrowserType,
  getDeviceBrowserType,
  getPlaywrightInstance,
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
    if (browserType !== CHROMIUM && launchOptions?.args) {
      launchOptions.args = launchOptions.args.filter(
        (item: string) => item !== '--no-sandbox',
      )
    }

    const options = getBrowserOptions(browserType, launchOptions)

    if (launchType === LAUNCH) {
      return playwrightInstance.launch(options)
    }

    if (launchType === PERSISTENT) {
      return playwrightInstance.launchPersistentContext(userDataDir!, options)
    }
  }

  const options = getBrowserOptions(browserType, connectOptions)
  return playwrightInstance.connect(options)
}

const getDeviceConfig = (
  device: Nullable<ConfigDeviceType> | undefined,
  availableDevices: Playwright['devices'],
): BrowserContextOptions => {
  if (device) {
    if (typeof device === 'string') {
      const { defaultBrowserType, ...deviceProps } = availableDevices[device]
      return deviceProps
    } else {
      const { name, defaultBrowserType, ...deviceProps } = device
      return deviceProps
    }
  }
  return {}
}

const getDeviceName = (
  device: Nullable<ConfigDeviceType>,
): Nullable<string> => {
  let deviceName: Nullable<string> = null
  if (device != null) {
    if (typeof device === 'string') {
      deviceName = device
    } else {
      deviceName = device.name
    }
  }
  return deviceName
}

export const getPlaywrightEnv = (basicEnv = 'node'): unknown => {
  const RootEnv = require(basicEnv === 'node'
    ? 'jest-environment-node'
    : 'jest-environment-jsdom')

  return class PlaywrightEnvironment extends RootEnv {
    readonly _config: JestPlaywrightProjectConfig
    _jestPlaywrightConfig!: JestPlaywrightConfig

    constructor(config: JestPlaywrightProjectConfig) {
      super(config)
      this._config = config
    }

    _getContextOptions(devices: Playwright['devices']): BrowserContextOptions {
      const { browserName, device } = this._config
      const browserType = getBrowserType(browserName)
      const { contextOptions } = this._jestPlaywrightConfig
      const deviceBrowserContextOptions = getDeviceConfig(device, devices)
      const resultContextOptions = deepMerge(
        deviceBrowserContextOptions,
        getBrowserOptions(browserName, contextOptions),
      )
      if (browserType === FIREFOX && resultContextOptions.isMobile) {
        console.warn(formatError(`isMobile is not supported in ${FIREFOX}.`))
        delete resultContextOptions.isMobile
      }
      return resultContextOptions
    }

    _getSeparateEnvBrowserConfig(
      isDebug: boolean,
      config: TestPlaywrightConfigOptions,
    ): JestPlaywrightConfig {
      const { debugOptions } = this._jestPlaywrightConfig
      const defaultBrowserConfig: JestPlaywrightConfig = {
        ...DEFAULT_CONFIG,
        launchType: LAUNCH,
      }
      let resultBrowserConfig: JestPlaywrightConfig = deepMerge(
        defaultBrowserConfig,
        config,
      )
      if (isDebug) {
        if (debugOptions) {
          resultBrowserConfig = deepMerge(resultBrowserConfig, debugOptions)
        }
      } else {
        resultBrowserConfig = deepMerge(
          this._jestPlaywrightConfig,
          resultBrowserConfig,
        )
      }
      return resultBrowserConfig
    }

    _getSeparateEnvContextConfig(
      isDebug: boolean,
      config: TestPlaywrightConfigOptions,
      browserName: BrowserType,
      devices: Playwright['devices'],
    ): BrowserContextOptions {
      const { device, contextOptions } = config
      const { debugOptions } = this._jestPlaywrightConfig
      const deviceContextOptions: BrowserContextOptions = getDeviceConfig(
        device,
        devices,
      )
      let resultContextOptions: BrowserContextOptions = contextOptions || {}
      if (isDebug) {
        if (debugOptions?.contextOptions) {
          resultContextOptions = deepMerge(
            resultContextOptions,
            debugOptions.contextOptions!,
          )
        }
      } else {
        resultContextOptions = deepMerge(
          this._jestPlaywrightConfig.contextOptions!,
          resultContextOptions,
        )
      }
      resultContextOptions = deepMerge(
        deviceContextOptions,
        resultContextOptions,
      )
      return getBrowserOptions(browserName, resultContextOptions)
    }

    async setup(): Promise<void> {
      const { wsEndpoint, browserName, testEnvironmentOptions } = this._config
      this._jestPlaywrightConfig = testEnvironmentOptions[
        CONFIG_ENVIRONMENT_NAME
      ] as JestPlaywrightConfig
      const {
        connectOptions,
        collectCoverage,
        exitOnPageError,
        selectors,
        launchType,
        skipInitialization,
      } = this._jestPlaywrightConfig
      if (wsEndpoint) {
        this._jestPlaywrightConfig.connectOptions = {
          ...connectOptions,
          wsEndpoint,
        }
      }
      const browserType = getBrowserType(browserName)
      const device = this._config.device
      const deviceName: Nullable<string> = getDeviceName(device)
      const {
        name,
        instance: playwrightInstance,
        devices,
      } = getPlaywrightInstance(browserType)
      const contextOptions = this._getContextOptions(devices)

      if (name === IMPORT_KIND_PLAYWRIGHT) {
        const playwright = require('playwright')
        if (selectors) {
          await Promise.all(
            selectors.map(({ name, script }) =>
              playwright.selectors
                .register(name, script)
                .catch((e: Error): void => {
                  if (!e.toString().includes('has been already')) {
                    throw e
                  }
                }),
            ),
          )
        }
      }

      this.global.browserName = browserType
      this.global.deviceName = deviceName
      if (!skipInitialization) {
        const browserOrContext = await getBrowserPerProcess(
          playwrightInstance as GenericBrowser,
          browserType,
          this._jestPlaywrightConfig,
        )
        this.global.browser =
          launchType === PERSISTENT ? null : browserOrContext
        this.global.context =
          launchType === PERSISTENT
            ? browserOrContext
            : await this.global.browser.newContext(contextOptions)
        if (collectCoverage) {
          await (this.global.context as BrowserContext).exposeFunction(
            'reportCodeCoverage',
            saveCoverageToFile,
          )
          await (this.global.context as BrowserContext).addInitScript(() =>
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
      }
      this.global.jestPlaywright = {
        configSeparateEnv: async (
          config: TestPlaywrightConfigOptions,
          isDebug = false,
        ): Promise<ConfigParams> => {
          const { device } = config
          const browserName =
            config.useDefaultBrowserType && device
              ? getDeviceBrowserType(device, devices) || CHROMIUM
              : config.browser || browserType
          const deviceName = device ? getDeviceName(device) : null
          checkDevice(deviceName, devices)
          const resultBrowserConfig: JestPlaywrightConfig = this._getSeparateEnvBrowserConfig(
            isDebug,
            config,
          )
          const resultContextOptions: BrowserContextOptions = this._getSeparateEnvContextConfig(
            isDebug,
            config,
            browserName,
            devices,
          )
          const { instance } = getPlaywrightInstance(browserName)
          const browser = await getBrowserPerProcess(
            instance as GenericBrowser,
            browserName,
            resultBrowserConfig,
          )
          const context = await (browser as Browser)!.newContext(
            resultContextOptions,
          )
          const page = await context!.newPage()
          return { browserName, deviceName, browser, context, page }
        },
        resetPage: async (): Promise<void> => {
          const { context, page } = this.global
          try {
            if (page) {
              page.removeListener('pageerror', handleError)
              await page.close()
            }
            // eslint-disable-next-line no-empty
          } catch (e) {}

          this.global.page = await context.newPage()
          if (exitOnPageError) {
            this.global.page.addListener('pageerror', handleError)
          }
        },
        resetContext: async (newOptions?: ConnectOptions): Promise<void> => {
          const { browser, context } = this.global

          await context?.close()

          const newContextOptions = newOptions
            ? deepMerge(contextOptions, newOptions)
            : contextOptions

          this.global.context = await browser.newContext(newContextOptions)

          await this.global.jestPlaywright.resetPage()
        },
        resetBrowser: async (newOptions?: ConnectOptions): Promise<void> => {
          const { browser } = this.global

          await browser?.close()

          this.global.browser = await getBrowserPerProcess(
            playwrightInstance as GenericBrowser,
            browserType,
            this._jestPlaywrightConfig,
          )

          await this.global.jestPlaywright.resetContext(newOptions)

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
              if (Object.values(KEYS).includes(key)) {
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
          saveCoverageOnPage(page, collectCoverage),
      }
    }

    async handleTestEvent(event: Event, state: State): Promise<void> {
      // Hack to set testTimeout for jestPlaywright debugging
      if (
        event.name === 'add_test' &&
        event.fn?.toString().includes('jestPlaywright.debug()')
      ) {
        state.testTimeout = DEBUG_TIMEOUT
      }
    }

    async teardown(): Promise<void> {
      const { browser, context, page } = this.global
      const { collectCoverage } = this._jestPlaywrightConfig
      page?.removeListener('pageerror', handleError)
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

      await browser?.close()

      await super.teardown()
    }
  }
}

export default getPlaywrightEnv()

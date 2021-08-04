import JestRunner from 'jest-runner'
import type { BrowserServer } from 'playwright-core'
import type {
  Test,
  TestRunnerContext,
  TestWatcher,
  OnTestStart,
  OnTestSuccess,
  OnTestFailure,
  TestRunnerOptions,
} from 'jest-runner'
import type { Config as JestConfig } from '@jest/types'
import type {
  BrowserType,
  BrowserTest,
  DeviceType,
  WsEndpointType,
  JestPlaywrightTest,
  JestPlaywrightConfig,
  ConfigDeviceType,
  Playwright,
} from '../types/global'
import {
  checkBrowserEnv,
  checkDevice,
  getDisplayName,
  readConfig,
  getPlaywrightInstance,
  getBrowserOptions,
  getBrowserType,
  getDeviceBrowserType,
  deepMerge,
  generateKey,
} from './utils'
import {
  DEBUG_TIMEOUT,
  DEFAULT_TEST_PLAYWRIGHT_TIMEOUT,
  CONFIG_ENVIRONMENT_NAME,
  SERVER,
  LAUNCH,
} from './constants'
import { setupCoverage, mergeCoverage } from './coverage'
import { GenericBrowser } from '../types/global'

const getBrowserTest = ({
  test,
  config,
  browser,
  wsEndpoint,
  device,
  testTimeout,
}: BrowserTest): JestPlaywrightTest => {
  const { displayName, testEnvironmentOptions } = test.context.config
  const playwrightDisplayName = getDisplayName(
    config.displayName || browser,
    device,
  )
  return {
    ...test,
    context: {
      ...test.context,
      config: {
        ...test.context.config,
        testEnvironmentOptions: {
          ...testEnvironmentOptions,
          [CONFIG_ENVIRONMENT_NAME]: { ...config, testTimeout },
        },
        browserName: browser,
        wsEndpoint,
        device,
        displayName: {
          name: displayName
            ? `${playwrightDisplayName} ${displayName.name || displayName}`
            : playwrightDisplayName,
          color: displayName?.color || 'yellow',
        },
      },
    },
  }
}

const getDevices = (
  devices: JestPlaywrightConfig['devices'],
  availableDevices: Playwright['devices'],
) => {
  let resultDevices: ConfigDeviceType[] = []

  if (devices) {
    if (devices instanceof RegExp) {
      resultDevices = Object.keys(availableDevices).filter((item) =>
        item.match(devices),
      )
    } else {
      resultDevices = devices
    }
  }

  return resultDevices
}

const getJestTimeout = (configTimeout?: number) => {
  if (configTimeout) {
    return configTimeout
  }
  return process.env.PWDEBUG ? DEBUG_TIMEOUT : DEFAULT_TEST_PLAYWRIGHT_TIMEOUT
}

class PlaywrightRunner extends JestRunner {
  browser2Server: Partial<Record<string, BrowserServer>>
  config: JestConfig.GlobalConfig
  constructor(
    globalConfig: JestConfig.GlobalConfig,
    context: TestRunnerContext,
  ) {
    const config = { ...globalConfig }
    // Set testTimeout
    config.testTimeout = getJestTimeout(config.testTimeout)
    super(config, context)
    this.browser2Server = {}
    this.config = config
  }

  async launchServer(
    config: JestPlaywrightConfig,
    wsEndpoint: WsEndpointType,
    browser: BrowserType,
    key: string,
    instance: GenericBrowser,
  ): Promise<WsEndpointType> {
    const { launchType, launchOptions, skipInitialization } = config
    if (!skipInitialization && launchType === SERVER && wsEndpoint === null) {
      if (!this.browser2Server[key]) {
        const options = getBrowserOptions(browser, launchOptions)
        this.browser2Server[key] = await instance.launchServer(options)
      }
    }
    return wsEndpoint || this.browser2Server[key]?.wsEndpoint() || null
  }

  async getTests(tests: Test[], config: JestPlaywrightConfig): Promise<Test[]> {
    const { browsers, devices, connectOptions, useDefaultBrowserType } = config
    const pwTests: Test[] = []
    for (const test of tests) {
      for (const browser of browsers) {
        const browserType = getBrowserType(
          typeof browser === 'string' ? browser : browser.name,
        )
        const browserConfig =
          typeof browser === 'string'
            ? config
            : deepMerge(config, browser || {})
        checkBrowserEnv(browserType)
        const { devices: availableDevices, instance } =
          getPlaywrightInstance(browserType)
        const resultDevices = getDevices(devices, availableDevices)
        const key =
          typeof browser === 'string'
            ? browser
            : generateKey(browser.name, browserConfig)
        const browserOptions = getBrowserOptions(browserType, connectOptions)
        const wsEndpoint: WsEndpointType = await this.launchServer(
          browserConfig,
          'wsEndpoint' in browserOptions ? browserOptions.wsEndpoint : null,
          browserType,
          key,
          instance as GenericBrowser,
        )

        const browserTest = {
          test: test as JestPlaywrightTest,
          config: browserConfig,
          wsEndpoint,
          browser: browserType,
          testTimeout: this.config.testTimeout,
        }

        if (resultDevices.length) {
          resultDevices.forEach((device: DeviceType) => {
            checkDevice(device, availableDevices)
            if (useDefaultBrowserType) {
              const deviceBrowser = getDeviceBrowserType(
                device!,
                availableDevices,
              )
              if (deviceBrowser !== null && deviceBrowser !== browser) return
            }
            pwTests.push(getBrowserTest({ ...browserTest, device }))
          })
        } else {
          pwTests.push(getBrowserTest({ ...browserTest, device: null }))
        }
      }
    }

    return pwTests
  }

  async runTests(
    tests: Test[],
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
    options: TestRunnerOptions,
  ): Promise<void> {
    const { rootDir, testEnvironmentOptions } = tests[0].context.config
    const config = await readConfig(
      rootDir,
      testEnvironmentOptions[CONFIG_ENVIRONMENT_NAME] as JestPlaywrightConfig,
    )
    if (this.config.testNamePattern) {
      config.launchType = LAUNCH
      config.skipInitialization = true
      config.haveSkippedTests = true
    }
    const browserTests = await this.getTests(tests, config)
    if (config.collectCoverage) {
      await setupCoverage()
    }
    await this[
      options.serial ? '_createInBandTestRun' : '_createParallelTestRun'
    ](browserTests, watcher, onStart, onResult, onFailure)

    for (const key in this.browser2Server) {
      await this.browser2Server[key]!.close()
    }
    if (config.collectCoverage) {
      await mergeCoverage()
    }
  }
}

export default PlaywrightRunner

import JestRunner from 'jest-runner'
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
} from '../types/global'
import {
  checkBrowserEnv,
  checkDevice,
  getDisplayName,
  readConfig,
  getPlaywrightInstance,
  getBrowserOptions,
} from './utils'
import {
  DEFAULT_TEST_PLAYWRIGHT_TIMEOUT,
  CONFIG_ENVIRONMENT_NAME,
  SERVER,
  CHROMIUM,
} from './constants'
import { BrowserServer, devices as PlaywrightDevices } from 'playwright-core'
import { setupCoverage, mergeCoverage } from './coverage'
import { GenericBrowser } from '../types/global'

const getBrowserTest = ({
  test,
  config,
  browser,
  wsEndpoint,
  device,
}: BrowserTest): JestPlaywrightTest => {
  const { displayName, testEnvironmentOptions } = test.context.config
  const playwrightDisplayName = getDisplayName(browser, device)
  return {
    ...test,
    context: {
      ...test.context,
      config: {
        ...test.context.config,
        testEnvironmentOptions: {
          ...testEnvironmentOptions,
          [CONFIG_ENVIRONMENT_NAME]: config,
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
  availableDevices: typeof PlaywrightDevices,
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

const getBrowser = (
  device: ConfigDeviceType,
  availableDevices: typeof PlaywrightDevices,
): BrowserType => {
  if (typeof device === 'string') {
    return availableDevices[device].defaultBrowserType
  }

  return device?.defaultBrowserType || CHROMIUM
}

class PlaywrightRunner extends JestRunner {
  browser2Server: Partial<Record<BrowserType, BrowserServer>>
  constructor(
    globalConfig: JestConfig.GlobalConfig,
    context: TestRunnerContext,
  ) {
    const config = { ...globalConfig }
    // Set default timeout to 15s
    config.testTimeout = config.testTimeout || DEFAULT_TEST_PLAYWRIGHT_TIMEOUT
    super(config, context)
    this.browser2Server = {}
  }

  async launchServer(
    config: JestPlaywrightConfig,
    wsEndpoint: WsEndpointType,
    browser: BrowserType,
    instance: GenericBrowser,
  ): Promise<WsEndpointType> {
    const { launchType, launchOptions, skipInitialization } = config
    if (!skipInitialization || (launchType === SERVER && wsEndpoint === null)) {
      if (!this.browser2Server[browser]) {
        const options = getBrowserOptions(browser, launchOptions)
        this.browser2Server[browser] = await instance.launchServer(options)
      }
    }
    return wsEndpoint || this.browser2Server[browser]?.wsEndpoint() || null
  }

  async getTests(tests: Test[], config: JestPlaywrightConfig): Promise<Test[]> {
    const { browsers, devices, connectOptions, useDefaultBrowserType } = config
    const pwTests: Test[] = []
    for (const test of tests) {
      if (useDefaultBrowserType) {
        const { devices: availableDevices, instance } = getPlaywrightInstance()
        const resultDevices = getDevices(devices, availableDevices)

        const browserTest = {
          test: test as JestPlaywrightTest,
          config,
        }
        if (resultDevices.length) {
          for (const device of resultDevices) {
            const browser = getBrowser(device, availableDevices)
            const wsEndpoint: WsEndpointType = await this.launchServer(
              config,
              connectOptions?.wsEndpoint || null,
              browser,
              (instance as Record<BrowserType, GenericBrowser>)[browser],
            )

            checkDevice(device, availableDevices)

            pwTests.push(
              getBrowserTest({ ...browserTest, browser, wsEndpoint, device }),
            )
          }
        }
      } else {
        for (const browser of browsers) {
          checkBrowserEnv(browser)
          const { devices: availableDevices, instance } = getPlaywrightInstance(
            browser,
          )
          const resultDevices = getDevices(devices, availableDevices)
          const wsEndpoint: WsEndpointType = await this.launchServer(
            config,
            connectOptions?.wsEndpoint || null,
            browser,
            instance as GenericBrowser,
          )

          const browserTest = {
            test: test as JestPlaywrightTest,
            config,
            wsEndpoint,
            browser,
          }

          if (resultDevices.length) {
            resultDevices.forEach((device: DeviceType) => {
              checkDevice(device, availableDevices)
              pwTests.push(getBrowserTest({ ...browserTest, device }))
            })
          } else {
            pwTests.push(getBrowserTest({ ...browserTest, device: null }))
          }
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
    const browserTests = await this.getTests(tests, config)
    if (config.collectCoverage) {
      await setupCoverage()
    }
    await this[
      options.serial ? '_createInBandTestRun' : '_createParallelTestRun'
    ](browserTests, watcher, onStart, onResult, onFailure)

    for (const browser in this.browser2Server) {
      await this.browser2Server[browser as BrowserType]!.close()
    }
    if (config.collectCoverage) {
      await mergeCoverage()
    }
  }
}

export default PlaywrightRunner

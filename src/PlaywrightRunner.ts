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
  CustomDeviceType,
  DeviceType,
  WsEndpointType,
  JestPlaywrightTest,
  JestPlaywrightConfig,
} from '../types/global'
import {
  checkBrowserEnv,
  checkDeviceEnv,
  getDisplayName,
  readConfig,
  getPlaywrightInstance,
  getBrowserOptions,
  formatError,
} from './utils'
import {
  DEFAULT_TEST_PLAYWRIGHT_TIMEOUT,
  CONFIG_ENVIRONMENT_NAME,
  SERVER,
  IMPORT_KIND_PLAYWRIGHT,
} from './constants'
import { BrowserServer } from 'playwright-core'
import { setupCoverage, mergeCoverage } from './coverage'

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
            ? `${playwrightDisplayName} ${
                typeof displayName === 'string' ? displayName : displayName.name
              }`
            : playwrightDisplayName,
          color: 'yellow',
        },
      },
    },
  }
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

  async getTests(tests: Test[], config: JestPlaywrightConfig): Promise<Test[]> {
    const {
      browsers,
      devices,
      launchType,
      launchOptions,
      useDefaultBrowserType,
    } = config
    let resultDevices: (string | CustomDeviceType)[] = []
    const pwTests: Test[] = []
    for (const test of tests) {
      for (const browser of browsers) {
        checkBrowserEnv(browser)
        const {
          devices: availableDevices,
          instance,
          name,
        } = getPlaywrightInstance(browser)
        let wsEndpoint: WsEndpointType = null
        if (launchType === SERVER) {
          if (!this.browser2Server[browser]) {
            const options = getBrowserOptions(browser, launchOptions)
            this.browser2Server[browser] = await instance.launchServer(options)
          }
          wsEndpoint = this.browser2Server[browser]!.wsEndpoint()
        }

        if (devices instanceof RegExp) {
          resultDevices = Object.keys(availableDevices).filter((item) =>
            item.match(devices),
          )
        } else {
          if (devices) {
            resultDevices = devices
          }
        }

        const browserTest = {
          test: test as JestPlaywrightTest,
          config,
          wsEndpoint,
          browser,
        }

        if (resultDevices.length) {
          resultDevices.forEach((device: DeviceType) => {
            if (typeof device === 'string') {
              const availableDeviceNames = Object.keys(availableDevices)
              checkDeviceEnv(device, availableDeviceNames)
            }
            if (useDefaultBrowserType) {
              if (typeof device === 'string') {
                const { defaultBrowserType } = availableDevices[device]
                if (
                  name === IMPORT_KIND_PLAYWRIGHT ||
                  defaultBrowserType === browser
                ) {
                  pwTests.push(
                    getBrowserTest({
                      ...browserTest,
                      browser: defaultBrowserType,
                      device,
                    }),
                  )
                } else {
                  if (defaultBrowserType !== browser) {
                    console.warn(
                      formatError(
                        `You try to use ${browser} for ${device}, but it's default browser is ${defaultBrowserType}`,
                      ),
                    )
                  }
                }
              }
            } else {
              pwTests.push(getBrowserTest({ ...browserTest, device }))
            }
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
      testEnvironmentOptions[CONFIG_ENVIRONMENT_NAME],
    )
    const browserTests = await this.getTests(tests, config)
    if (config.collectCoverage) {
      await setupCoverage()
    }
    await (options.serial
      ? this['_createInBandTestRun'](
          browserTests,
          watcher,
          onStart,
          onResult,
          onFailure,
        )
      : this['_createParallelTestRun'](
          browserTests,
          watcher,
          onStart,
          onResult,
          onFailure,
        ))

    for (const browser in this.browser2Server) {
      await this.browser2Server[browser as BrowserType]!.close()
    }
    if (config.collectCoverage) {
      await mergeCoverage()
    }
  }
}

export default PlaywrightRunner

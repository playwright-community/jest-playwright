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
  DeviceType,
  JestPlaywrightTest,
  JestPlaywrightConfig,
} from './types'
import {
  checkBrowserEnv,
  checkDeviceEnv,
  getDisplayName,
  readConfig,
  getPlaywrightInstance,
  getBrowserOptions,
} from './utils'
import { DEFAULT_TEST_PLAYWRIGHT_TIMEOUT } from './constants'
import { BrowserServer } from 'playwright-core'
import { setupCoverage, mergeCoverage } from './coverage'

const getBrowserTest = (
  test: JestPlaywrightTest,
  browser: BrowserType,
  wsEndpoint: string,
  device: DeviceType,
): JestPlaywrightTest => {
  const { displayName } = test.context.config
  const playwrightDisplayName = getDisplayName(browser, device)
  return {
    ...test,
    context: {
      ...test.context,
      config: {
        ...test.context.config,
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
    const { browsers, devices, launchOptions } = config
    const pwTests: Test[] = []
    for (const test of tests) {
      for (const browser of browsers) {
        checkBrowserEnv(browser)
        const { devices: availableDevices, instance } = getPlaywrightInstance(
          browser,
        )
        if (!this.browser2Server[browser]) {
          const options = getBrowserOptions(browser, launchOptions)
          this.browser2Server[browser] = await instance.launchServer(options)
        }
        const wsEndpoint = this.browser2Server[browser]!.wsEndpoint()

        if (devices && devices.length) {
          devices.forEach((device: DeviceType) => {
            if (typeof device === 'string') {
              const availableDeviceNames = Object.keys(availableDevices)
              checkDeviceEnv(device, availableDeviceNames)
            }
            pwTests.push(
              getBrowserTest(
                test as JestPlaywrightTest,
                browser,
                wsEndpoint,
                device,
              ),
            )
          })
        } else {
          pwTests.push(
            getBrowserTest(
              test as JestPlaywrightTest,
              browser,
              wsEndpoint,
              null,
            ),
          )
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
    const config = await readConfig(tests[0].context.config.rootDir)
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

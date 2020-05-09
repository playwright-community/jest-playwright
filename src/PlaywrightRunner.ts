// @ts-nocheck
import JestRunner, {
  Test,
  TestRunnerContext,
  TestWatcher,
  OnTestStart,
  OnTestSuccess,
  OnTestFailure,
  TestRunnerOptions,
} from 'jest-runner'
import playwright from 'playwright-core'
import { Config as JestConfig } from '@jest/types'
import { BrowserType } from './constants'
import {
  checkBrowserEnv,
  checkDeviceEnv,
  getDisplayName,
  readConfig,
} from './utils'

const getBrowserTest = (
  test: Test,
  browser: BrowserType,
  device: string,
): Test => {
  const { displayName } = test.context.config
  const playwrightDisplayName = getDisplayName(browser, device)
  return {
    ...test,
    context: {
      ...test.context,
      config: {
        ...test.context.config,
        browserName: browser,
        device,
        displayName: {
          name: displayName
            ? `${playwrightDisplayName} ${displayName.name}`
            : playwrightDisplayName,
          color: 'yellow',
        },
      },
    },
  }
}

const getTests = (
  browsers: BrowserType[],
  devices: string[],
  tests: Test[],
): Test[] => {
  return browsers.flatMap((browser) => {
    checkBrowserEnv(browser)
    return devices.length
      ? devices.flatMap((device) => {
          const availableDevices = Object.keys(playwright.devices)
          checkDeviceEnv(device, availableDevices)
          return tests.map((test) => getBrowserTest(test, browser, device))
        })
      : tests.map((test) => getBrowserTest(test, browser))
  })
}

class PlaywrightRunner extends JestRunner {
  constructor(
    globalConfig: JestConfig.GlobalConfig,
    context: TestRunnerContext,
  ) {
    const config = { ...globalConfig }
    // Set default timeout to 15s
    config.testTimeout = config.testTimeout || 15000
    super(config, context)
  }

  async runTests(
    tests: Test[],
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
    options: TestRunnerOptions,
  ): Promise<void> {
    const { browsers, devices } = await readConfig(this._globalConfig.rootDir)
    const browserTests = getTests(browsers, devices, tests)

    return await (options.serial
      ? this._createInBandTestRun(
          browserTests,
          watcher,
          onStart,
          onResult,
          onFailure,
        )
      : this._createParallelTestRun(
          browserTests,
          watcher,
          onStart,
          onResult,
          onFailure,
        ))
  }
}

export default PlaywrightRunner

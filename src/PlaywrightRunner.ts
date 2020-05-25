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
import type { BrowserType } from './types'
import {
  checkBrowserEnv,
  checkDeviceEnv,
  getDisplayName,
  readConfig,
  getPlaywrightInstance,
  readPackage,
} from './utils'
import { DEFAULT_TEST_PLAYWRIGHT_TIMEOUT } from './constants'

const getBrowserTest = (
  test: Test,
  browser: BrowserType,
  device: string | null,
): Test => {
  const { displayName } = test.context.config
  const playwrightDisplayName = getDisplayName(browser, device)
  return {
    ...test,
    context: {
      ...test.context,
      config: {
        ...test.context.config,
        // @ts-ignore
        browserName: browser,
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

const getTests = async (tests: Test[]): Promise<Test[]> => {
  const playwrightPackage = await readPackage()
  const pwTests: Test[] = []
  await Promise.all(
    tests.map(async (test) => {
      const { rootDir } = test.context.config
      const { browsers, devices } = await readConfig(rootDir)
      browsers.forEach((browser) => {
        checkBrowserEnv(browser)
        const { devices: availableDevices } = getPlaywrightInstance(
          playwrightPackage,
          browser,
        )
        if (devices && devices.length) {
          devices.forEach((device) => {
            const availableDeviceNames = Object.keys(availableDevices)
            checkDeviceEnv(device, availableDeviceNames)
            pwTests.push(getBrowserTest(test, browser, device))
          })
        } else {
          pwTests.push(getBrowserTest(test, browser, null))
        }
      })
    }),
  )
  return pwTests
}

class PlaywrightRunner extends JestRunner {
  constructor(
    globalConfig: JestConfig.GlobalConfig,
    context: TestRunnerContext,
  ) {
    const config = { ...globalConfig }
    // Set default timeout to 15s
    config.testTimeout = config.testTimeout || DEFAULT_TEST_PLAYWRIGHT_TIMEOUT
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
    const browserTests = await getTests(tests)

    return await (options.serial
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
  }
}

export default PlaywrightRunner

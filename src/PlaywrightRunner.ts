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
import type { BrowserType, GenericBrowser } from './types'
import {
  checkBrowserEnv,
  checkDeviceEnv,
  getDisplayName,
  readConfig,
  getPlaywrightInstance,
  readPackage,
} from './utils'
import { DEFAULT_TEST_PLAYWRIGHT_TIMEOUT } from './constants'
import { BrowserServer } from 'playwright-core'

const getBrowserTest = (
  test: Test,
  browser: BrowserType,
  wsEndpoint: string,
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
        // @ts-ignore
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

const getTests = async (tests: Test[]): Promise<Test[]> => {
  const playwrightPackage = await readPackage()
  const pwTests: Test[] = []
  const browser2Server: Partial<Record<BrowserType, BrowserServer>> = {}
  for (const test of tests) {
    const { rootDir } = test.context.config
    const { browsers, devices, launchBrowserApp } = await readConfig(rootDir)
    for (const browser of browsers) {
      checkBrowserEnv(browser)
      const { devices: availableDevices, instance } = getPlaywrightInstance(
        playwrightPackage,
        browser,
      )
      if (!browser2Server[browser]) {
        browser2Server[browser] = await instance.launchServer(launchBrowserApp)
      }
      const wsEndpoint = browser2Server[browser]!.wsEndpoint()

      if (devices && devices.length) {
        devices.forEach((device) => {
          const availableDeviceNames = Object.keys(availableDevices)
          checkDeviceEnv(device, availableDeviceNames)
          pwTests.push(getBrowserTest(test, browser, wsEndpoint, device))
        })
      } else {
        pwTests.push(getBrowserTest(test, browser, wsEndpoint, null))
      }
    }
  }

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

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
import { Config as JestConfig } from '@jest/types'
import { BrowserType } from './constants'
import { getDisplayName, readConfig } from './utils'

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
            ? `${playwrightDisplayName} ${displayName}`
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
  let browserTests: Test[] = []
  browsers.forEach((browser) => {
    devices.length
      ? devices.forEach((device) => {
          tests.forEach((test) => {
            browserTests = [
              ...browserTests,
              getBrowserTest(test, browser, device),
            ]
          })
        })
      : tests.forEach((test) => {
          browserTests = [...browserTests, getBrowserTest(test, browser)]
        })
  })
  return browserTests
}

class PlaywrightRunner extends JestRunner {
  constructor(
    globalConfig: JestConfig.GlobalConfig,
    context: TestRunnerContext,
  ) {
    super(globalConfig, context)
  }

  async runTests(
    tests: Test[],
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
    options: TestRunnerOptions,
  ) {
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

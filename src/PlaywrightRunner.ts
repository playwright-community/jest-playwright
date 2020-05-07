//@ts-nocheck
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
import { readConfig } from './utils'

const getBrowserTest = (test: Test, browser: BrowserType): Test => ({
  ...test,
  context: {
    ...test.context,
    config: {
      ...test.context.config,
      browserName: browser,
      displayName: { name: browser, color: 'yellow' },
    },
  },
})

const getTests = (browsers: BrowserType[], tests: Test[]): Test[] => {
  let browserTests: Test[] = []
  browsers.forEach((browser) => {
    tests.map((test) => {
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
    const { browsers } = await readConfig(this._globalConfig.rootDir)
    const browserTests = getTests(browsers, tests)

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

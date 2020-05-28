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
import { getDisplayName } from './utils'
import { DEFAULT_TEST_PLAYWRIGHT_TIMEOUT } from './constants'

const getTests = (tests: Test[]): Test[] => {
  //@ts-ignore
  return tests.map((test) => {
    const { displayName } = test.context.config
    //@ts-ignore
    const playwrightDisplayName = getDisplayName(test.browser, test.device)
    const pwTest = {
      ...test,
      context: {
        ...test.context,
        config: {
          ...test.context.config,
          //@ts-ignore
          browserName: test.browser,
          displayName: {
            name: displayName
              ? `${playwrightDisplayName} ${
                  typeof displayName === 'string'
                    ? displayName
                    : displayName.name
                }`
              : playwrightDisplayName,
            color: 'yellow',
          },
        },
      },
    }
    //@ts-ignore
    delete pwTest.browserName
    //@ts-ignore
    delete pwTest.device
    return pwTest
  })
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

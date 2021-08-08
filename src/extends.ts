/* global jestPlaywright, browserName, deviceName */
/* eslint-disable @typescript-eslint/no-explicit-any*/
import { getSkipFlag, deepMerge } from './utils'
import {
  JestPlaywrightGlobal,
  SkipOption,
  TestPlaywrightConfigOptions,
} from '../types/global'
import { CONFIG_ENVIRONMENT_NAME, DEBUG_TIMEOUT } from './constants'

declare const global: JestPlaywrightGlobal

type TestType = 'it' | 'describe'

const DEBUG_OPTIONS = {
  launchOptions: {
    headless: false,
    devtools: true,
  },
}

const runDebugTest = (jestTestType: jest.It, ...args: any[]) => {
  const isConfigProvided = typeof args[0] === 'object'
  const lastArg = args[args.length - 1]
  const timer = typeof lastArg === 'number' ? lastArg : DEBUG_TIMEOUT
  // TODO Looks weird - need to be rewritten
  let options = DEBUG_OPTIONS as TestPlaywrightConfigOptions
  if (isConfigProvided) {
    options = deepMerge(DEBUG_OPTIONS, args[0])
  }

  jestTestType(
    args[isConfigProvided ? 1 : 0],
    async () => {
      const envArgs = await jestPlaywright.configSeparateEnv(options, true)
      try {
        await args[isConfigProvided ? 2 : 1](envArgs)
      } finally {
        await envArgs.browser!.close()
      }
    },
    timer,
  )
}

// @ts-ignore
it.jestPlaywrightDebug = (...args) => {
  runDebugTest(it, ...args)
}

it.jestPlaywrightDebug.only = (...args: any[]) => {
  runDebugTest(it.only, ...args)
}

it.jestPlaywrightDebug.skip = (...args: any[]) => {
  runDebugTest(it.skip, ...args)
}

const runConfigTest = (
  jestTypeTest: jest.It,
  playwrightOptions: Partial<TestPlaywrightConfigOptions>,
  ...args: any[]
) => {
  const lastArg = args[args.length - 1]
  const timer =
    typeof lastArg === 'number'
      ? lastArg
      : global[CONFIG_ENVIRONMENT_NAME].testTimeout
  jestTypeTest(
    args[0],
    async () => {
      const envArgs = await jestPlaywright.configSeparateEnv(playwrightOptions)
      try {
        await args[1](envArgs)
      } finally {
        await envArgs.browser!.close()
      }
    },
    timer,
  )
}

//@ts-ignore
it.jestPlaywrightConfig = (playwrightOptions, ...args) => {
  runConfigTest(it, playwrightOptions, ...args)
}

it.jestPlaywrightConfig.only = (...args) => {
  runConfigTest(it.only, ...args)
}

it.jestPlaywrightConfig.skip = (...args) => {
  runConfigTest(it.skip, ...args)
}

const customSkip = (skipOption: SkipOption, type: TestType, ...args: any[]) => {
  const skipFlag = getSkipFlag(skipOption, browserName, deviceName)
  if (skipFlag) {
    // @ts-ignore
    global[type].skip(...args)
  } else {
    // @ts-ignore
    global[type](...args)
  }
}

it.jestPlaywrightSkip = (skipOption, ...args) => {
  customSkip(skipOption, 'it', ...args)
}

//@ts-ignore
describe.jestPlaywrightSkip = (skipOption: SkipOption, ...args) => {
  customSkip(skipOption, 'describe', ...args)
}

beforeEach(async () => {
  if (global[CONFIG_ENVIRONMENT_NAME].resetContextPerTest) {
    await jestPlaywright.resetContext()
  }
})

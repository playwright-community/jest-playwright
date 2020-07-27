/* global jestPlaywright, browserName, deviceName */
// TODO Rewrite with TS?
const { getSkipFlag, deepMerge } = require('./lib/utils')

const DEBUG_OPTIONS = {
  launchOptions: {
    headless: false,
    devtools: true,
  },
}

const runDebugTest = (jestTestType, ...args) => {
  const isConfigProvided = typeof args[0] === 'object'
  // TODO Looks wierd - need to be rewritten
  let options = DEBUG_OPTIONS
  if (isConfigProvided) {
    options = deepMerge(DEBUG_OPTIONS, args[0])
  }

  jestTestType(args[isConfigProvided ? 1 : 0], async () => {
    const { browser, context, page } = await jestPlaywright._configSeparateEnv(
      options,
      true,
    )
    try {
      await args[isConfigProvided ? 2 : 1]({ browser, context, page })
    } finally {
      await browser.close()
    }
  })
}

it.jestPlaywrightDebug = (...args) => {
  runDebugTest(it, ...args)
}

it.jestPlaywrightDebug.only = (...args) => {
  runDebugTest(it.only, ...args)
}

it.jestPlaywrightDebug.skip = (...args) => {
  runDebugTest(it.skip, ...args)
}

const runConfigTest = (jestTypeTest, playwrightOptions, ...args) => {
  if (playwrightOptions.browser && playwrightOptions.browser !== browserName) {
    it.skip(...args)
  } else {
    jestTypeTest(args[0], async () => {
      const {
        browser,
        context,
        page,
      } = await jestPlaywright._configSeparateEnv(playwrightOptions)
      try {
        await args[1]({ browser, context, page })
      } finally {
        await browser.close()
      }
    })
  }
}

it.jestPlaywrightConfig = (playwrightOptions, ...args) => {
  runConfigTest(it, playwrightOptions, ...args)
}

it.jestPlaywrightConfig.only = (...args) => {
  runConfigTest(it.only, ...args)
}

it.jestPlaywrightConfig.skip = (...args) => {
  runConfigTest(it.skip, ...args)
}

const customSkip = (skipOption, type, ...args) => {
  const skipFlag = getSkipFlag(skipOption, browserName, deviceName)
  if (skipFlag) {
    global[type].skip(...args)
  } else {
    global[type](...args)
  }
}

it.jestPlaywrightSkip = (skipOption, ...args) => {
  customSkip(skipOption, 'it', ...args)
}

describe.jestPlaywrightSkip = (skipOption, ...args) => {
  customSkip(skipOption, 'describe', ...args)
}

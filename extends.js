/* global jestPlaywright, browserName, deviceName */
const { getSkipFlag } = require('./lib/utils')

const DEBUG_OPTIONS = {
  launchType: 'LAUNCH',
  launchOptions: {
    headless: false,
    devtools: true,
  },
}

it.jestPlaywrightDebug = (...args) => {
  // TODO:
  //  1. Add input validation
  //  2. Unite jestPlaywrightDebug and jestPlaywrightConfig in one function
  //  3. Check out passing config to jestPlaywright._configSeparateEnv
  it(args[0], async () => {
    const { browser, context, page } = await jestPlaywright._configSeparateEnv(
      DEBUG_OPTIONS,
    )
    try {
      await args[1]({ browser, context, page })
    } finally {
      await browser.close()
    }
  })
}

it.jestPlaywrightConfig = (playwrightOptions, ...args) => {
  if (playwrightOptions.browser && playwrightOptions.browser !== browserName) {
    it.skip(...args)
  } else {
    it(args[0], async () => {
      const {
        browser,
        context,
        page,
      } = await jestPlaywright._configSeparateEnv({
        ...DEBUG_OPTIONS,
        playwrightOptions,
      })
      try {
        await args[1]({ browser, context, page })
      } finally {
        await browser.close()
      }
    })
  }
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

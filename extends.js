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
  // TODO: Add ability to pass config with the first argument
  it(args[0], async () => {
    const { browser, context, page } = await jestPlaywright._configSeparateEnv(
      DEBUG_OPTIONS,
      true,
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
      } = await jestPlaywright._configSeparateEnv(playwrightOptions)
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

// TODO Put information about changes in Readme before 1.3.0
it.jestPlaywrightSkip = (skipOption, ...args) => {
  customSkip(skipOption, 'it', ...args)
}

describe.jestPlaywrightSkip = (skipOption, ...args) => {
  customSkip(skipOption, 'describe', ...args)
}

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
  const isConfigProvided = typeof args[0] === 'object'
  // TODO Looks wierd - need to be rewritten
  let options = DEBUG_OPTIONS
  if (isConfigProvided) {
    const {
      contextOptions,
      launchOptions = {},
      launchType = DEBUG_OPTIONS.launchType,
    } = args[0]
    options = {
      ...DEBUG_OPTIONS,
      launchType,
      launchOptions: { ...DEBUG_OPTIONS.launchOptions, ...launchOptions },
      contextOptions,
    }
  }

  it(args[isConfigProvided ? 1 : 0], async () => {
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

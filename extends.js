/* global jestPlaywright, browserName */
const DEBUG_OPTIONS = {
  launchType: 'LAUNCH',
  launchOptions: {
    headless: false,
    devtools: true,
  },
}

it.jestPlaywrightDebug = (...args) => {
  // TODO Add some input validation
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

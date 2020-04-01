beforeEach(async () => {
  const handleError = (error) => {
    process.emit('uncaughtException', error)
  }

  global.context = await global.browser.newContext(
    global.jestPlaywright.__contextOptions,
  )
  global.page = await global.context.newPage()
  global.page.on('pageerror', handleError)
})

afterEach(async () => {
  if (global.context) {
    await global.context.close()
    delete global.context
    delete global.page
  }
})

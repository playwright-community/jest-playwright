/// <reference types="./../types/global" />
describe('Example setContext test', () => {
  it('should be able to execute javascript 1', async () => {
    page.setContent(`<script>document.write("test")</script>`)
    const element = await page.waitForSelector('text=test')
    expect(element).toBeTruthy()
  })
  it.jestPlaywrightSkip(
    { browsers: ['chromium'] },
    'should be able to execute javascript 2',
    async () => {
      page.setContent(`<script>document.write("test")</script>`)
      const element = await page.waitForSelector('text=test')
      expect(element).toBeTruthy()
    },
  )
})

describe.jestPlaywrightSkip(
  { browsers: ['chromium'] },
  'Can skip describe block',
  () => {
    it('should be able to execute javascript 1', async () => {
      page.setContent(`<script>document.write("test")</script>`)
      const element = await page.waitForSelector('text=test')
      expect(element).toBeTruthy()
    })
  },
)

describe('Debug helper functions', () => {
  const configOptions = {
    contextOptions: { locale: 'nl-NL' },
    browser: 'webkit',
    device: 'iPhone 11',
  }

  it.jestPlaywrightConfig(
    configOptions,
    'jestPlaywrightConfig',
    async ({ browserName, page }) => {
      expect(browserName).toBe('webkit')
      expect(page.viewportSize()).toEqual({ width: 414, height: 896 })
    },
  )

  const debugOptions = {
    launchOptions: {
      devtools: false,
      headless: true,
    },
    browser: 'firefox',
  }

  it.jestPlaywrightDebug(
    debugOptions,
    'jestPlaywrightDebug',
    async ({ browserName }) => {
      expect(browserName).toBe('firefox')
    },
  )
})

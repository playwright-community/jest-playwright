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
  }

  it.jestPlaywrightConfig(
    configOptions,
    'jestPlaywrightConfig',
    async ({ page }) => {
      await page.goto('https://www.whatismybrowser.com/')
      const browser = await (await page.$('.string-major'))?.innerHTML()
      expect(browser).toContain('Safari')
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
    async ({ page }) => {
      await page.goto('https://www.whatismybrowser.com/')
      const browser = await (await page.$('.string-major'))?.innerHTML()
      expect(browser).toContain('Firefox')
    },
  )
})

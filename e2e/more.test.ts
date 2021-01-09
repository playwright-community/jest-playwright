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
  const config = {
    contextOptions: { locale: 'nl-NL' },
    browsers: [],
    exitOnPageError: true,
    collectCoverage: false,
    browser: 'webkit',
  }

  it.jestPlaywrightConfig(config, 'jestPlaywrightConfig', async ({ page }) => {
    await page.goto('https://www.whatismybrowser.com/')
    const browser = await (await page.$('.string-major'))?.innerHTML()
    expect(browser).toContain('Safari on macOS')
  })
})

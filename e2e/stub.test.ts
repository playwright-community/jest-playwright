import path from 'path'

jest.setTimeout(10000)

describe('Example HTML file', () => {
  it('should detect the heading "Example" on page', async () => {
    await page.goto(`file:${path.join(__dirname, 'example.html')}`)
    const browser = await page.$eval('h1', (el) => el.textContent)
    expectAllBrowsers(browser).toBe('Example')
  })
})

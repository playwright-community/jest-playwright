/// <reference types="./../src/types" />
import path from 'path'

describe('Example HTML file', () => {
  it('should detect the heading "Example" on page', async () => {
    await page.goto(`file:${path.join(__dirname, 'example.html')}`)
    const browser = await page.$eval('h1', (el) => el.textContent)
    expect(browser).toBe('Example')
    expect(browserName).toBeTruthy()
  })
})

import path from 'path'

describe('Example HTML file', () => {
  it('should detect the heading "Example" on page', async () => {
    await page.goto(`file:${path.join(__dirname, 'example.html')}`)
    expect(page.url()).not.toBe('about:blank')
    const browser = await page.$eval('h1', (el) => el.textContent)
    expect(browser).toBe('Example')
  })
  it('should not reuse the page', async () => {
    expect(page.url()).toBe('about:blank')
  })
})

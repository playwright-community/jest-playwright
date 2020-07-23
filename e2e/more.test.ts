/// <reference types="./../types/global" />
describe('Example setContext test', () => {
  it('should be able to execute javascript 1', async () => {
    page.setContent(`<script>document.write("test")</script>`)
    const element = await page.waitForSelector('text=test')
    expect(element).toBeTruthy()
  })
  jestPlaywright.skip(
    { browsers: ['chromium'] },
    'should be able to execute javascript 2',
    async () => {
      page.setContent(`<script>document.write("test")</script>`)
      const element = await page.waitForSelector('text=test')
      expect(element).toBeTruthy()
    },
  )
})

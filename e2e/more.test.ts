describe('Example setContext test', () => {
  it('should be able to execute javascript', async () => {
    page.setContent(`<script>document.write("test")</script>`)
    const element = await page.waitForSelector('text=test')
    expect(element).toBeTruthy()
  })
})

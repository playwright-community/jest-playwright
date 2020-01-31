# Jest Playwright

Running your tests using Jest & Playwright

```
npm install jest-playwright-preset playwright
```

## Usage

Update your Jest configuration:

```json
"jest": {
    "preset": "jest-playwright-preset"
  }
```

You should provide **browser** option as environment variable:


Use Playwright in your tests:
```json
"test": "BROWSER=chromium jest"
```


```js
describe('Google', () => {
    beforeAll(async () => {
        await page.goto('https://whatismybrowser.com/')
    })

    it('should display "google" text on page', async () => {
        const browser = await page.$eval('.string-major a', el => el.text);
        expect(browser).toContain('Chrome')
    })
})
```

## Inspiration

Thanks to [Smooth Code](https://github.com/smooth-code) for great [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer).

## License

MIT

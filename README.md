# Jest Playwright

Running your tests using [Jest](https://github.com/facebook/jest) & [Playwright](https://github.com/microsoft/playwright)

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

## Configuration

You can specify a `jest-playwright.config.js` at the root of the project or define a custom path using `JEST_PLAYWRIGHT_CONFIG` environment variable. It should export a config object.

- `launchBrowserApp` <[object]> [All Playwright launch options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsertypelaunchbrowserappoptions) can be specified in config. Since it is JavaScript, you can use all stuff you need, including environment.
- `context` <[object]> [All Playwright context options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsernewcontextoptions) can be specified in config.
- `browser` <[string]>. Define a [browser](https://github.com/microsoft/playwright/blob/master/docs/api.md#class-browsertype) to run tests into.
  - `chromium` Each test runs Chromium.
  - `firefox` Each test runs Firefox.
  - `webkit` Each test runs Webkit.
- `exitOnPageError` <[boolean]> Exits page on any global error message thrown. Defaults to `true`.

## Browser type

You can specify browser in multiple ways:

- With `BROWSER` environment variable
- With your `jest-playwright.config.js`

If you don't pass any value it will be use `chromium` as default

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
    const browser = await page.$eval('.string-major a', el => el.text)
    expect(browser).toContain('Chrome')
  })
})
```

## Inspiration

Thanks to [Smooth Code](https://github.com/smooth-code) for great [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer).

## License

MIT

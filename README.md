# Jest Playwright

[![Greenkeeper badge](https://badges.greenkeeper.io/mmarkelov/jest-playwright.svg)](https://greenkeeper.io/)

Running your tests using [Jest](https://github.com/facebook/jest) & [Playwright](https://github.com/microsoft/playwright)

```
npm install jest-playwright-preset playwright
```

## Usage

Update your Jest configuration:

- with `package.json`:

```json
"jest": {
    "preset": "jest-playwright-preset"
  }
```

- with `jest.config.js`:

```javascript
module.exports = {
    preset: "jest-playwright-preset",
    ...
}
```

**NOTE**: Be sure to remove any existing `testEnvironment` option from your Jest configuration. The `jest-playwright-preset` preset needs to manage that option itself.

## Configuration

You can specify a `jest-playwright.config.js` at the root of the project or define a custom path using `JEST_PLAYWRIGHT_CONFIG` environment variable. It should export a config object.

- `launchBrowserApp` <[object]> [All Playwright launch options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsertypelaunchbrowserappoptions) can be specified in config. Since it is JavaScript, you can use all stuff you need, including environment.
- `context` <[object]> [All Playwright context options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsernewcontextoptions) can be specified in config.
- `browser` <[string]>. Define a [browser](https://github.com/microsoft/playwright/blob/master/docs/api.md#class-browsertype) to run tests into.
  - `chromium` Each test runs Chromium.
  - `firefox` Each test runs Firefox.
  - `webkit` Each test runs Webkit.
- `device` <[string]>. Define a [device](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsertypedevices) to run tests into. Actual list of devices can be found [here](https://github.com/Microsoft/playwright/blob/master/src/deviceDescriptors.ts)
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

## Put in debug mode

Debugging tests can be hard sometimes and it is very useful to be able to pause tests in order to inspect the browser. Jest Playwright exposes a method `jestPlaywright.debug()` that suspends test execution and gives you opportunity to see what's going on in the browser.

```javascript
await jestPlaywright.debug()
```

## Inspiration

Thanks to [Smooth Code](https://github.com/smooth-code) for great [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer).

## License

MIT

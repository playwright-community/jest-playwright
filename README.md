# Jest Playwright

[![Greenkeeper badge](https://badges.greenkeeper.io/mmarkelov/jest-playwright.svg)](https://greenkeeper.io/)

Running your tests using [Jest](https://github.com/facebook/jest) & [Playwright](https://github.com/microsoft/playwright)

```
npm install -D jest jest-playwright-preset playwright
```

Also you can use `jest-playwright-preset` with specific playwright packages:
`playwright-webkit`, `playwright-chromium` and `playwright-firefox`

```
npm install -D jest jest-playwright-preset playwright-firefox
```

## Usage

Update your Jest configuration, either:

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

Use Playwright in your tests:

- with `package.json`

```json
{
  "scripts": {
    "test": "jest"
  }
}
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

## Configuration

You can specify a `jest-playwright.config.js` at the root of the project or define a custom path using `JEST_PLAYWRIGHT_CONFIG` environment variable. It should export a config object.

- `launchBrowserApp` <[object]> [All Playwright launch options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsertypelaunchbrowserappoptions) can be specified in config. Since it is JavaScript, you can use all stuff you need, including environment.
- `context` <[object]> [All Playwright context options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsernewcontextoptions) can be specified in config.
- `browser` <[string]>. Define a [browser](https://github.com/microsoft/playwright/blob/master/docs/api.md#class-browsertype) to run tests into.
  - `chromium` Each test runs Chromium (default).
  - `firefox` Each test runs Firefox.
  - `webkit` Each test runs Webkit.
- `device` <[string]>. Define a [device](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsertypedevices) to run tests into. Actual list of devices can be found [here](https://github.com/Microsoft/playwright/blob/master/src/deviceDescriptors.ts)
- `exitOnPageError` <[boolean]> Exits page on any global error message thrown. Defaults to `true`.

**Note**: 
- You can also specify browser with `BROWSER` environment variable. You should do it only if you are using the whole playwright package.
- You can specify device with `DEVICE` environment variable.

## Put in debug mode

Debugging tests can be hard sometimes and it is very useful to be able to pause tests in order to inspect the browser. Jest Playwright exposes a method `jestPlaywright.debug()` that suspends test execution and gives you opportunity to see what's going on in the browser.

```javascript
await jestPlaywright.debug()
```

## Start a server

Jest Playwright integrates a functionality to start a server when running your test suite, like [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer/blob/master/README.md#start-a-server). It automatically closes the server when tests are done.

To use it, specify a server section in your `jest-playwright.config.js`.

```js
// jest-playwright.config.js
module.exports = {
  server: {
    command: 'node server.js',
    port: 4444,
  },
}
```

Other options are documented in [jest-dev-server](https://github.com/smooth-code/jest-puppeteer/tree/master/packages/jest-dev-server).

## Unstable and experimental API

From version **0.0.7** you can run you tests for multiple browsers.

- You must have installed **playwright** package
- You must define browser to test with your `jest-playwright.config.js`:

```javascript
module.exports = {
    browsers: ["chromium", "webkit"],
    ...
}
```

- You must run your tests with **jest-playwright**

```json
"test:parallel": "jest-playwright --parallel"
```

## Inspiration

Thanks to [Smooth Code](https://github.com/smooth-code) for great [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer).

## License

MIT

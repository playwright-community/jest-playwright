# Jest Playwright

[![Coverage Status](https://coveralls.io/repos/github/mmarkelov/jest-playwright/badge.svg?branch=master)](https://coveralls.io/github/mmarkelov/jest-playwright?branch=master)

Running your tests using [Jest](https://github.com/facebook/jest) & [Playwright](https://github.com/microsoft/playwright)

```bash
npm install -D jest jest-playwright-preset playwright
```

Also you can use `jest-playwright-preset` with specific playwright packages:
`playwright-webkit`, `playwright-chromium` and `playwright-firefox`

```bash
npm install -D jest jest-playwright-preset playwright-firefox
```

## Requirements

- Node.js >= 10.15.0
- Playwright >=0.12.1

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
    const browser = await page.$eval('.string-major', (el) => el.innerHTML)
    expect(browser).toContain('Chrome')
  })
})
```

## Configuration

You can specify a `jest-playwright.config.js` at the root of the project or define a custom path using `JEST_PLAYWRIGHT_CONFIG` environment variable. It should export a config object.

- `launchBrowserApp` <[object]> [All Playwright launch options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsertypelaunchoptions) can be specified in config. Since it is JavaScript, you can use all stuff you need, including environment.
- `connectBrowserApp` <[object]> [All Playwright connect options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsertypeconnectoptions) can be specified in config.
- `context` <[object]> [All Playwright context options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsernewcontextoptions) can be specified in config.
- `browser` <[string]>. Define a [browser](https://github.com/microsoft/playwright/blob/master/docs/api.md#class-browsertype) to run tests into.
  - `chromium` Each test runs Chromium (default).
  - `firefox` Each test runs Firefox.
  - `webkit` Each test runs Webkit.
- `device` <[string]>. Define a [device](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsertypedevices) to run tests into. Actual list of devices can be found [here](https://github.com/Microsoft/playwright/blob/master/src/deviceDescriptors.ts)
- `exitOnPageError` <[boolean]> Exits page on any global error message thrown. Defaults to `true`.
- `server` <[object]> [All `jest-dev-server` options](https://github.com/smooth-code/jest-puppeteer/tree/master/packages/jest-dev-server#options)
- `selectors` <[array]>. Define [selector](https://github.com/microsoft/playwright/blob/v0.11.1/docs/api.md#class-selectors). Each selector must be an object with name and script properties.

  Usage with [query-selector-shadow-dom](https://github.com/Georgegriff/query-selector-shadow-dom):

  `jest-playwright.config.js`:

```javascript
const {
  selectorEngine,
} = require('query-selector-shadow-dom/plugins/playwright');

module.exports = {
  selectors: [
    {name: 'shadow', script: selectorEngine}
  ],
  ...
}

```

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

## ESLint globals / `'page' is not defined`

There is [eslint-plugin-jest-playwright](https://github.com/mxschmitt/eslint-plugin-jest-playwright) available which includes the globals for using jest-playwright. 

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

From version **0.0.13** you can run you tests for multiple devices.

```javascript
module.exports = {
    devices: ["iPhone 6", "Pixel 2"],
    ...
}
```

It will run your tests depending on you playwright package.

- If you are using specific playwright package, it will run test for this specific browser
- With installed **playwright** package you can define browsers with config:

```javascript
module.exports = {
   browsers: ["chromium", "firefox"],
   devices: ["iPhone 6", "Pixel 2"],
   ...
}
```

If there is no defined browsers in config it will run tests for chromium browser.

[More details](https://github.com/mmarkelov/jest-playwright/pull/54#issuecomment-592514337)

- You must run your tests with **jest-playwright**

```json
"test:parallel": "jest-playwright --parallel"
```

## Known issues

### Error reporting with Jest

If you face into error messages like `UnhandledPromiseRejectionWarning: Error: Protocol error (Runtime.callFunctionOn): Target closed.` or

```txt
Timeout - Async callback was not invoked within the 20000ms timeout specified by jest.setTimeout.Timeout - Async callback was not invoked within the 20000ms timeout specified by jest.setTimeout.Error:
```

and your Jest error reporting will only show that an entire test (`it()` function) has failed, then you need to increase the Jest timeout because the Playwright timeout is greater than the Jest timeout. So Jest in the end will simply stop the execution and no verbose (which exact line) error reporting can be generated.

To fix this behavior simply call

```javascript
jest.setTimeout(35 * 1000)
```

in your tests at the top. (30 seconds is the default Playwright timeout for waiting for an specific element.)

### New Browser instance for each test

If for your individual tests a new entire browser instance spins up each time and it won't be reused, then you probably run them in parallel. If you run them in a synchronous way with the `--runInBand` CLI option for Jest, then the same browser instance will be re-used and this should fix the issue.

## Inspiration

Thanks to [Smooth Code](https://github.com/smooth-code) for great [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer).

## License

MIT

# Jest Playwright

![CI](https://github.com/playwright-community/jest-playwright/workflows/Node.js/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/mmarkelov/jest-playwright/badge.svg?branch=master)](https://coveralls.io/github/mmarkelov/jest-playwright?branch=master)
![npm](https://img.shields.io/npm/v/jest-playwright-preset)

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
describe('What is my browser', () => {
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

You can specify a `jest-playwright.config.js` at the root of the project or define a custom path using the `JEST_PLAYWRIGHT_CONFIG` environment variable. It should export a config object.

- `launchBrowserApp` <[object]> [All Playwright launch options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsertypelaunchoptions) can be specified in config. Since it is JavaScript, you can use all stuff you need, including environment.
- `connectBrowserApp` <[object]> [All Playwright connect options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsertypeconnectoptions) can be specified in config.
- `context` <[object]> [All Playwright context options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsernewcontextoptions) can be specified in config.
- `browsers` <[string[]]>. Define [browsers](https://github.com/microsoft/playwright/blob/master/docs/api.md#class-browsertype) to run tests in.
  - `chromium` Each test runs Chromium (default).
  - `firefox` Each test runs Firefox.
  - `webkit` Each test runs Webkit.
- `devices` <[string[]]>. Define a [devices](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsertypedevices) to run tests in. Actual list of devices can be found [here](https://github.com/Microsoft/playwright/blob/master/src/deviceDescriptors.ts).
- `exitOnPageError` <[boolean]> Exits process on any page error. Defaults to `true`.
- `server` <[object]> [All `jest-dev-server` options](https://github.com/smooth-code/jest-puppeteer/tree/master/packages/jest-dev-server#options).
- `selectors` <[array]>. Define [selectors](https://github.com/microsoft/playwright/blob/v0.11.1/docs/api.md#class-selectors). Each selector must be an object with name and script properties.

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

- You can also specify browser with the `BROWSER` environment variable. You should do it only if you are using the whole playwright package.
- You can specify device with `DEVICE` environment variable.

## Globals

- `browserName` <[string]> - name of the current browser (chromium, firefox or webkit)
- `deviceName` <[string]> - name of the current device
- `browser` <[[Browser](https://playwright.dev/#version=master&path=docs%2Fapi.md&q=class-browser)]> - Playwright browser instance
- `context` <[[Context](https://playwright.dev/#version=master&path=docs%2Fapi.md&q=class-browsercontext)]> - Playwright context instance
- `page` <[[Page](https://playwright.dev/#version=master&path=docs%2Fapi.md&q=class-page)]> - Playwright page instance

All of them are available globally in each Jest test. If you are using ESLint and JavaScript, its recommend to use it in combination with the [eslint-plugin-jest-playwright](https://github.com/playwright-community/eslint-plugin-jest-playwright).

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

## Using with different jest environments

The default **jest-playwright** environment is **node**, but you can use a browser-like environment through [jest-playwright-jsdom](https://github.com/playwright-community/jest-playwright-jsdom)

## expect-playwright

There is a utility package [expect-playwright](https://github.com/playwright-community/expect-playwright) which simplifies the expect statements in combination with Playwright to make e.g. shorter text comparisons.

## ESLint globals / `'page' is not defined`

There is an ESLint plugin available [eslint-plugin-jest-playwright](https://github.com/playwright-community/eslint-plugin-jest-playwright) available which includes the globals for using jest-playwright.

## Unstable and experimental API

You can run tests for multiple browsers and devices:

- You must have installed the **playwright** package
- You must define browsers to test with your `jest-playwright.config.js`:

```javascript
module.exports = {
    browsers: ["chromium", "webkit"],
    devices: ["iPhone 6", "Pixel 2"],
    ...
}
```

It will run your tests for:

- **Chromium** browser and **iPhone 6** device;
- **Chromium** browser and **Pixel 2** device;
- **Webkit** browser and **iPhone 6** device;
- **Webkit** browser and **Pixel 2** device;

If there is no defined browsers in config it will run tests for chromium browser.

## Usage with [jest-circus](https://github.com/facebook/jest/tree/master/packages/jest-circus)

You can use **jest-playwright** with the **jest-circus** runner for taking screenshots during test failures for example:

**jest.config.json**

```json
"testRunner": "jest-circus/runner",
"testEnvironment": "./CustomEnvironment.js"
```

**CustomEnvironment.js**

```js
const PlaywrightEnvironment = require('jest-playwright-preset/lib/PlaywrightEnvironment')
  .default

class CustomEnvironment extends PlaywrightEnvironment {
  async setup() {
    await super.setup()
    // Your setup
  }

  async teardown() {
    // Your teardown
    await super.teardown()
  }

  async handleTestEvent(event) {
    if (event.name === 'test_done' && event.test.errors.length > 0) {
      const parentName = event.test.parent.name.replace(/\W/g, '-')
      const specName = event.test.name.replace(/\W/g, '-')

      await this.global.page.screenshot({
        path: `screenshots/${parentName}_${specName}.png`,
      })
    }
  }
}

module.exports = CustomEnvironment
```

## Usage with Typescript

Example Jest configuration in combination with [ts-jest](https://github.com/kulshekhar/ts-jest):

```javascript
module.exports = {
  preset: 'jest-playwright-preset',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
}
```

Types are also available, which you can either use via directly in your test:

```typescript
/// <reference types="jest-playwright-preset" />
/// <reference types="expect-playwright" />
```

or at your central `tsconfig.json` either via `files`:

```json
{
  "files": [
    "./global.d.ts",
    "node_modules/jest-playwright-preset/types/global.d.ts",
    "node_modules/expect-playwright/global.d.ts"
  ]
}
```

or via `types`:

```json
{
  "compilerOptions": {
    "types": ["jest-playwright-preset", "expect-playwright"]
  }
}
```

It's important to not change the `testEnvironment` to `node`. Otherwise it won't work.

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

Thanks to [Smooth Code](https://github.com/smooth-code) for the great [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer).

## License

MIT

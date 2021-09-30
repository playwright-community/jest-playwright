# Jest Playwright

![CI](https://github.com/playwright-community/jest-playwright/workflows/Node.js/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/mmarkelov/jest-playwright/badge.svg?branch=master)](https://coveralls.io/github/mmarkelov/jest-playwright?branch=master)
![npm](https://img.shields.io/npm/v/jest-playwright-preset)

## ⚠️ We recommend the official [Playwright test-runner (@playwright/test)](https://playwright.dev/docs/test-intro) ⚠️

It's more flexible, lightweight, optimized for Playwright, and has TypeScript support out of the box. This doesn't mean, that we stop with maintaining this package.

---

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
- Playwright >= 0.12.1
- Jest >= 25

## Usage

Update your Jest configuration, either:

with `package.json`:

```json
"jest": {
  "preset": "jest-playwright-preset"
}
```

or with `jest.config.js`:

```javascript
module.exports = {
  preset: 'jest-playwright-preset',
}
```

And add the Jest command as in the script section of your `package.json`:

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

Now you can use Playwright in your tests:

```js
beforeAll(async () => {
  await page.goto('https://whatismybrowser.com/')
})

test('should display correct browser', async () => {
  const browser = await page.$eval('.string-major', (el) => el.innerHTML)
  expect(browser).toContain('Chrome')
})
```

### Notes

`playwright` actions can take some time for execution, because of it `jest-playwright` overrides jest default timeout interval from 5 to 15 seconds.
You can change this interval with [`testTimeout`](https://jestjs.io/docs/en/configuration#testtimeout-number) in your `jest` configuration.

## Configuration

It's recommend to use a separate Jest configuration `jest.e2e.config.js` for `jest-playwright` to gain speed improvements and by that to only use Playwright in the end-to-end tests. For that you have to use the `-c` flag when calling Jest and use the [`testMatch`](https://jestjs.io/docs/en/configuration#testmatch-arraystring) or [`testRegex`](https://jestjs.io/docs/en/configuration#testregex-string--arraystring) in your Jest config to split them.

Be sure to remove any existing `testEnvironment` option from your Jest configuration. The `jest-playwright-preset` preset needs to manage that option itself.

Configuration options can be specified using a `jest-playwright.config.js` file at the root of your project:

```js
// jest-playwright.config.js

module.exports = {
  // Options...
}
```

Similar to Jest [globalSetup](https://jestjs.io/docs/next/configuration#globalsetup-string) configuration can except the export of an async function:

```js
module.exports = async () => {
  await ...
};
```

A custom path can be specified to the `jest-playwright.config.js` file within your `jest.config.js` file:

```js
process.env.JEST_PLAYWRIGHT_CONFIG = '/path/to/jest-playwright.config.js'
```

Alternatively, configuration options can specified using Jest's own [`testEnvironmentOptions`](https://jestjs.io/docs/en/configuration#testenvironmentoptions-object) option within your `jest.config.js` file:

```js
// jest.config.js

module.exports = {
  preset: 'jest-playwright-preset',
  testEnvironmentOptions: {
    'jest-playwright': {
      // Options...
    },
  },
}
```

### Options

- `launchOptions` <[object]>. [All Playwright launch options](https://playwright.dev/docs/api/class-browsertype#browsertypelaunchoptions) can be specified in config. Since it is JavaScript, you can use all stuff you need, including environment.
- `launchType` <[**LAUNCH**](https://playwright.dev/docs/api/class-browsertype#browsertypelaunchoptions) | [**PERSISTENT**](https://playwright.dev/docs/api/class-browsertype#browsertypelaunchpersistentcontextuserdatadir-options) | [**SERVER**](https://playwright.dev/docs/api/class-browsertype#browsertypelaunchserveroptions)>. Method to launch browser instance. `jest-playwright` attaches Playwright to an existing browser instance by default.
- `connectOptions` <[object]>. [All Playwright connect options](https://playwright.dev/docs/api/class-browsertype#browsertypeconnectparams) can be specified in config.
- `contextOptions` <[object]>. [All Playwright context options](https://playwright.dev/docs/api/class-browser#browsernewcontextoptions) can be specified in config.
- [browsers](#browser-configuration) <[(string | object)[]]>. Define [browsers](https://playwright.dev/docs/api/class-browsertype/) to run tests in.
  - `chromium` Each test runs Chromium (default).
  - `firefox` Each test runs Firefox.
  - `webkit` Each test runs Webkit.
- [devices](#device-configuration) <[(string | object)[] | RegExp]>. Define a [devices](https://playwright.dev/docs/api/class-playwright/#playwrightdevices) to run tests in. Actual list of devices can be found [here](https://github.com/microsoft/playwright/blob/master/src/server/deviceDescriptors.js).
- `exitOnPageError` <[boolean]>. Exits process on any page error. Defaults to `true`.
- `collectCoverage` <[boolean]>. Enables the coverage collection of the `saveCoverage(page)` calls to the `.nyc_output/coverage.json` file.
- `serverOptions` <[object]>. [All `jest-process-manager` options](https://github.com/playwright-community/jest-process-manager#options).
- `selectors` <[array]>. Define [selectors](https://playwright.dev/docs/api/class-selectors/). Each selector must be an object with name and script properties.
- `skipInitialization` <[boolean]>. Add you ability to skip first setup `playwright` process. Possible use cases can be found [here](https://github.com/playwright-community/jest-playwright/issues/424)
- `resetContextPerTest` <[boolean]>. Option for opening a new context per test
- `useDefaultBrowserType` <[boolean]>. [Sometimes](https://github.com/microsoft/playwright/issues/2787) `browser` + `device` combinations don't have any sense. With this option tests will be run with [`defaultBrowserType`](https://github.com/microsoft/playwright/pull/3731) of device. Pay attention that you should define **devices** to correct usage of this option.

### Usage of process environment to define browser

You can control the browser with passing environment variable.

```js
// jest-playwright.config.js
module.exports = {
  browsers: [process.env.BROWSER],
}
```

### Specific browser options

For `launchOptions`, `connectOptions` and `contextOptions` you can define special browser options.

```js
// jest-playwright.config.js
module.exports = {
  connectOptions: {
    chromium: {
      wsEndpoint: 'ws://chrome.proxy.com:4444'
    },
    firefox: {
      wsEndpoint: 'ws://firefox.proxy.com:4444'
    }
  },
  ...
}
```

### Browser configuration

There are different ways to define devices in your configuration file:

- You can use array of browser names:

```js
module.exports = {
  browsers: ["chromium", "webkit"],
  ...
}
```

- You can define custom browser. You can find out use cases [here](https://github.com/playwright-community/jest-playwright/issues/539):

```js
{
  // Name of browser
  name: 'chromium' | 'firefox' | 'webkit'
  // Display name for test
  displayName: string
  ...
  // Browser options
}
```

### Device configuration

There are different ways to define devices in your configuration file:

- You can use array of device names:

```js
module.exports = {
  devices: ["iPhone 6", "Pixel 2"],
  ...
}
```

- You can use **RegExp**:

```js
module.exports = {
  devices: /iPhone 8/,
  ...
}
```

- Also you can define custom device:

```js
{
  // Name of device
  name: string
  // Page width and height
  viewport: {
    width: number
    height: number
  }
  // user agent
  userAgent: string
  // device scale factor
  deviceScaleFactor: number
  // is device is mobile
  isMobile: boolean
  // support of touch events
  hasTouch: boolean
  // device default browser
  defaultBrowserType: chromium, firefox or webkit
}
```

## Globals

- `browserName` <[string]> - name of the current browser (chromium, firefox or webkit)
- `deviceName` <[string]> - name of the current device
- `browser` <[[Browser](https://playwright.dev/docs/api/class-browser/)]> - Playwright browser instance
- `context` <[[Context](https://playwright.dev/docs/api/class-browsercontext/)]> - a new Playwright context instance for each new test file
- `page` <[[Page](https://playwright.dev/docs/api/class-page/)]> - Playwright page instance (since a new context for every test file also creates a new page for it)

All of them are available globally in each Jest test. If you are using ESLint and JavaScript, its recommend to use it in combination with the [eslint-plugin-jest-playwright](https://github.com/playwright-community/eslint-plugin-jest-playwright).

## Debug mode

Playwright give you [ability](https://playwright.dev/docs/debug/#run-in-debug-mode) to configure the browser for debugging with the `PWDEBUG` environment variable. It will launch the browser in headful mode, disables playwright timeout and **Jest** won't timeout anymore.:

```js
PWDEBUG=1 jest
```

## Reset helper functions

### Reset current page

```js
beforeEach(async () => {
  await jestPlaywright.resetPage()
})
```

To create a new page for each test, you can use this snippet to have a new page object for each individual test.

### Reset current context

```js
beforeEach(async () => {
  await jestPlaywright.resetContext()
})
```

To create a new context for each test, you can use this snippet to have a new context object for each individual test.

### Reset current browser

```js
beforeEach(async () => {
  await jestPlaywright.resetBrowser()
})
```

You can use this snippet to reset current browser for each individual test. It will reset browser, context and page.

## Debug helper functions

`jest-playwright` provides some functions to debug your tests.

**IMPORTANT NOTE**: For these kind of tests you should use properties passed through callback function instead of [globals](https://github.com/playwright-community/jest-playwright#globals)

### jestPlaywrightDebug

This helper function provide you ability to run specific tests in `debug` mode. It will disable `headless` mode.
You can find more information [here](https://github.com/playwright-community/jest-playwright/issues/216)

```js
test.jestPlaywrightDebug('failed', async ({ page }) => {
  await page.goto('https://github.com/')
  const title = await page.title()
  await expect(title).toBe('Google')
})
```

Also you can define options for `debug` mode with `debugOptions`:

```js
// jest-playwright.config.js
module.exports = {
  debugOptions: {
    ...
    contextOptions: {
      offline: true
    }
  }
  ...
}
```

### jestPlaywrightConfig

This helper function provide you ability to run specific tests with passed options.
You can define `browser` and `device` properties to run test for them, otherwise test run for current configuration.

```js
test.jestPlaywrightConfig(
  {
    // your jest-playwright options
  },
  'test name',
  async ({ browser, context, page }) => {
    /* ... */
  },
)
```

## Tracking the coverage

It's possible to track the coverage of the end-to-end tests with the [babel-plugin-istanbul](https://github.com/istanbuljs/babel-plugin-istanbul) Babel plugin configured. It needs to be included in the web application which you are gonna test otherwise it won't work. To use it, you have to set `collectCoverage` in the `jest-playwright.config.js` to `true`. Per default the test coverage will be automatically saved after each navigation change (`beforeunload` event). If a certain code path is not covered, you can manually call and add the corresponding `saveCoverage(page)` call to your tests like that:

```js
await jestPlaywright.saveCoverage(page)
```

By using coverage collection, it will write the coverage data to the `.nyc_output/coverage.json` file which can be transformed using [`nyc`](https://github.com/istanbuljs/nyc#readme) to the lcov format:

```
npx nyc report --reporter=lcovonly
```

or to HTML:

```
npx nyc report --reporter=html
```

which will create a HTML website in the `coverage` directory.

## Skip tests for specific browsers and devices

It's possible to skip tests for browsers or combination of browsers and devices

```js
it.jestPlaywrightSkip(
  { browsers: ['chromium'] },
  'should skip this one',
  async () => {
    const title = await page.title()
    expect(title).toBe('Google')
  },
)
```


## Using [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) selectors

Playwright engine pierces open shadow DOM by [default](https://playwright.dev/docs/selectors?_highlight=shadow#selector-engines).

```js
beforeAll(async () => {
  await page.goto(
    'https://mdn.github.io/web-components-examples/popup-info-box-web-component/',
  )
})

test('should display "google" text on page', async () => {
  const shadowElem = await page.$('.info')
  const shadowElemText = await shadowElem.innerHTML()

  expect(shadowElemText).toBe(
    'Your card validation code (CVC) is an extra security feature — it is the last 3 or 4 numbers on the back of your card.',
  )
})
```

## Start a server

Jest Playwright integrates a functionality to start a server when running your test suite, like [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer/blob/master/README.md#start-a-server). It automatically closes the server when tests are done.

To use it, specify a server section in your `jest-playwright.config.js`.

```js
// jest-playwright.config.js
module.exports = {
  serverOptions: {
    command: 'node server.js',
    port: 4444,
  },
}
```

Other options are documented in [jest-process-manager](https://github.com/playwright-community/jest-process-manager).

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

## Usage with custom [testEnvironment](https://jestjs.io/docs/en/configuration#testenvironment-string)

You can use **jest-playwright** with custom test environment for taking screenshots during test failures for example:

**jest.config.json**

```json
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
    await super.handleTestEvent(event);
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

## Usage with custom [runner](https://jestjs.io/docs/en/configuration#runner-string)

**jest-playwright** using custom runner underhood. So if you need implement your own `runner`, you should extend it:

**jest.config.json**

```json
"runner": "./CustomRunner.js"
```

**CustomRunner.js**

```js
const PlaywrightRunner = require('jest-playwright-preset/lib/PlaywrightRunner')
  .default

class CustomRunner extends PlaywrightRunner {
  constructor(...args) {
    super(...args)
    this.isSerial = true
  }
}

module.exports = CustomRunner
```

## Usage with custom [`globalSetup`](https://facebook.github.io/jest/docs/en/configuration.html#globalsetup-string) and [`globalTeardown`](https://facebook.github.io/jest/docs/en/configuration.html#globalteardown-string)

For this use case, `jest-playwright-preset` exposes two methods: `globalSetup` and `globalTeardown`, so that you can wrap them with your own global setup and global teardown methods as the following example:

### Getting authentication state once for all test cases [as per playwright reference](https://playwright.dev/docs/auth?_highlight=globals#reuse-authentication-state):
```js
// global-setup.js
import { globalSetup as playwrightGlobalSetup } from 'jest-playwright-preset';

module.exports = async function globalSetup(globalConfig) {
  await playwrightGlobalSetup(globalConfig);

  const browserServer = await chromium.launchServer();
  const wsEndpoint = browserServer.wsEndpoint();
  const browser = await chromium.connect({ wsEndpoint: wsEndpoint });
  const page = await browser.newPage();

  // your login function
  await doLogin(page);

  // store authentication data
  const storage = await page.context().storageState();
  process.env.STORAGE = JSON.stringify(storage);
};
```

```js
// global-teardown.js
import { globalTeardown as playwrightGlobalTeardown } from 'jest-playwright-preset';

module.exports = async function globalTeardown(globalConfig) {
  // Your global teardown
  await playwrightGlobalTeardown(globalConfig);
}
```

Then assigning your js file paths to the [`globalSetup`](https://facebook.github.io/jest/docs/en/configuration.html#globalsetup-string) and [`globalTeardown`](https://facebook.github.io/jest/docs/en/configuration.html#globalteardown-string) property in your Jest configuration.

```js
{
  // ...
  "globalSetup": "./global-setup.js",
  "globalTeardown": "./global-teardown.js"
}
```

Now your custom `globalSetup` and `globalTeardown` will be triggered once before and after all test suites.


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

If you face into error messages like

```
UnhandledPromiseRejectionWarning: Error: Protocol error (Runtime.callFunctionOn): Target closed.
```

or

```
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

## Examples

Demonstration the usage of `jest-playwright` for various test cases can be found in [`playwright-jest-examples`](https://github.com/playwright-community/playwright-jest-examples)

## Inspiration

Thanks to [Smooth Code](https://github.com/smooth-code) for the great [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer).

## License

[MIT](https://github.com/playwright-community/jest-playwright/blob/master/LICENSE)

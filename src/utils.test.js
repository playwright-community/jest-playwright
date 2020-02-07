const fs = require('fs')
const path = require('path')
const { readConfig, getBrowserType } = require('./utils')
const { DEFAULT_CONFIG, CHROMIUM } = require('./constants')

jest.spyOn(fs, 'exists')

beforeEach(() => {
  jest.resetModules()
})

describe('readConfig', () => {
  it('should return the default configuration if there was no seperate configuration specified', async () => {
    const config = await readConfig()
    expect(config).toMatchObject(DEFAULT_CONFIG)
  })
  it('should overwrite with a custom configuration', async () => {
    fs.exists.mockImplementationOnce((_, cb) => cb(true))
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => ({
        launchBrowserApp: {
          headless: true,
        },
        browser: 'chromium',
        context: {
          ignoreHTTPSErrors: true,
        },
      }),
      { virtual: true },
    )
    const config = await readConfig()
    const expectedConfig = {
      launchBrowserApp: {
        headless: true,
        webSocket: true,
      },
      context: {
        ignoreHTTPSErrors: true,
      },
      browser: 'chromium',
      exitOnPageError: true,
    }
    expect(config).toMatchObject(expectedConfig)
  })
  it('should overwrite with a custom configuration and spread the "launchBrowserApp" and "context" setting', async () => {
    fs.exists.mockImplementationOnce((_, cb) => cb(true))
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => ({
        launchBrowserApp: {
          headless: true,
        },
        context: {
          foo: true,
        },
      }),
      { virtual: true },
    )
    const config = await readConfig()
    const expectedConfig = {
      launchBrowserApp: {
        headless: true,
        webSocket: true,
      },
      context: {
        foo: true,
      },
      browser: 'chromium',
      exitOnPageError: true,
    }
    expect(config).toMatchObject(expectedConfig)
  })
})

describe('getBrowserType', () => {
  it('should return "chromium" as default', async () => {
    const config = await readConfig()
    const browserType = getBrowserType(config)
    expect(browserType).toBe(CHROMIUM)
  })
})

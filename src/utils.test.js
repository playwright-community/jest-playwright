import { checkBrowserEnv, readPackage } from './utils'

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

describe('checkBrowserEnv', () => {
  it('should throw Error with unknown type', async () => {
    fs.exists.mockImplementationOnce((_, cb) => cb(true))
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => ({
        browser: 'unknown',
      }),
      { virtual: true },
    )
    const config = await readConfig()
    const browserType = getBrowserType(config)
    expect(() => checkBrowserEnv(browserType)).toThrow()
  })
})

describe('readPackage', () => {
  it('should return null when dependencies does not passed', async () => {
    fs.exists.mockImplementationOnce((_, cb) => cb(true))
    jest.mock(
      path.join(__dirname, '..', 'package.json'),
      () => ({
        dependencies: {},
      }),
      { virtual: true },
    )
    let error
    try {
      await readPackage()
    } catch (e) {
      error = e
    }
    expect(error).toEqual(
      new Error('None of playwright packages was not found in dependencies'),
    )
  })
  it('should return playwright when it is defined', async () => {
    fs.exists.mockImplementationOnce((_, cb) => cb(true))
    jest.mock(
      path.join(__dirname, '..', 'package.json'),
      () => ({
        dependencies: {
          playwright: '*',
        },
      }),
      { virtual: true },
    )

    const playwright = await readPackage()
    expect(playwright).toEqual('playwright')
  })
  it('should return playwright-firefox when it is defined', async () => {
    fs.exists.mockImplementationOnce((_, cb) => cb(true))
    jest.mock(
      path.join(__dirname, '..', 'package.json'),
      () => ({
        devDependencies: {
          'playwright-firefox': '*',
        },
      }),
      { virtual: true },
    )

    const playwright = await readPackage()
    expect(playwright).toEqual('playwright-firefox')
  })
})

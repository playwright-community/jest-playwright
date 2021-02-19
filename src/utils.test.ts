import fs from 'fs'
import path from 'path'
import * as Utils from './utils'
import { DEFAULT_CONFIG, CHROMIUM, FIREFOX } from './constants'
import type { BrowserType, JestPlaywrightConfig } from '../types/global'
import { Playwright } from '../types/global'

const {
  readConfig,
  getBrowserType,
  checkBrowserEnv,
  checkDeviceEnv,
  checkDevice,
  getPlaywrightInstance,
  getDisplayName,
  getSkipFlag,
  getBrowserOptions,
  getDeviceBrowserType,
  generateKey,
} = Utils

beforeEach(() => {
  jest.resetModules()
})

describe('readConfig', () => {
  it('should return the default configuration if there was no separate configuration specified', async () => {
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => ({}),
      { virtual: true },
    )
    const config = await readConfig()
    expect(config).toMatchObject(DEFAULT_CONFIG)
  })
  it('should overwrite with a custom configuration', async () => {
    const configObject = {
      launchOptions: {
        headless: true,
      },
      browsers: ['chromium'],
      contextOptions: {
        viewport: {
          width: 800,
          height: 640,
        },
        ignoreHTTPSErrors: true,
      },
    }
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => configObject,
      { virtual: true },
    )
    const config = await readConfig()
    expect(config).toMatchObject(configObject)
  })
  it('should overwrite config if the second param is passed', async () => {
    const configObject = {
      launchOptions: {
        headless: true,
      },
      browsers: ['chromium'],
    }
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => ({
        launchOptions: {
          headless: true,
        },
        browsers: ['webkit'],
      }),
      { virtual: true },
    )
    const config = await readConfig(
      process.cwd(),
      configObject as JestPlaywrightConfig,
    )
    expect(config).toMatchObject(configObject)
  })
  it('should overwrite with a custom configuration and spread the "launchOptions" and "contextOptions" setting', async () => {
    const configObject = {
      launchOptions: {
        headless: true,
      },
      contextOptions: {
        foo: true,
      },
    }
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => configObject,
      { virtual: true },
    )
    const config = await readConfig()
    const expectedConfig = {
      ...configObject,
      browsers: ['chromium'],
      exitOnPageError: true,
    }
    expect(config).toMatchObject(expectedConfig)
  })
  it('should throw error if JEST_PLAYWRIGHT_CONFIG is defined but does not exist', async () => {
    process.env.JEST_PLAYWRIGHT_CONFIG = 'unreached.js'
    let error
    try {
      await readConfig()
    } catch (e) {
      error = e
    }
    expect(error).toBeTruthy()
    delete process.env.JEST_PLAYWRIGHT_CONFIG
  })
  it('should check cjs config if npm_package_type is module', async () => {
    process.env.npm_package_type = 'module'
    const configPath = path.join(__dirname, '..', 'jest-playwright.config.cjs')
    const configObject = {
      browsers: ['webkit'],
      launchOptions: {
        headless: true,
      },
      contextOptions: {
        foo: true,
      },
    }
    fs.writeFileSync(configPath, '')
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.cjs'),
      () => configObject,
      {
        virtual: true,
      },
    )
    const expectedConfig = {
      ...configObject,
      exitOnPageError: true,
    }
    const config = await readConfig()
    expect(config).toMatchObject(expectedConfig)
    delete process.env.npm_package_type
    fs.unlinkSync(configPath)
  })
})

describe('generateKey', () => {
  const config = {
    launchOptions: {
      headless: false,
      executablePath: '/usr/bin/microsoft-edge',
    },
  } as JestPlaywrightConfig
  it('should generate same key for same objects', () => {
    const key1 = generateKey('chromium', config)
    const key2 = generateKey('chromium', config)
    expect(key1).toBe(key2)
  })

  it('should generate different key for different objects', () => {
    const chromiumConfig = {
      launchOptions: {
        headless: false,
        executablePath: '/usr/bin/google-chrome-stable',
      },
    } as JestPlaywrightConfig
    const key1 = generateKey('chromium', config)
    const key2 = generateKey('chromium', chromiumConfig)
    expect(key1).not.toBe(key2)
  })
})

describe('getDisplayName', () => {
  it('should return right display name for passed browser', () => {
    expect(getDisplayName('chromium', null)).toBe('browser: chromium')
  })

  it('should return right display name for passed browser and device', () => {
    expect(getDisplayName('chromium', 'iPhone 6')).toBe(
      'browser: chromium device: iPhone 6',
    )
  })

  it('should return right display name for passed browser and custom device', () => {
    const customDevice = {
      name: 'Custom device',
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    }
    expect(getDisplayName('chromium', customDevice)).toBe(
      'browser: chromium device: Custom device',
    )
  })
})

describe('getBrowserType', () => {
  it('should return "chromium" as default', async () => {
    const browserType = getBrowserType()
    expect(browserType).toBe(CHROMIUM)
  })
  it('should return passed browser if it is passed', async () => {
    const browserType = getBrowserType('firefox')
    expect(browserType).toBe('firefox')
  })
})

describe('getBrowserOptions', () => {
  it('should return empty object for empty options', () => {
    const options = getBrowserOptions(CHROMIUM)
    expect(options).toBe({})
  })

  it('should return root options', () => {
    const launchOptions = { headless: false }
    const options = getBrowserOptions(CHROMIUM, launchOptions)
    expect(options).toStrictEqual(launchOptions)
  })

  it('should return options for defined browser', () => {
    const launchOptions = { headless: false, chromium: { headless: true } }
    const options = getBrowserOptions(CHROMIUM, launchOptions)
    expect(options).toStrictEqual({ headless: true })
  })

  it('should return root options for other browser', () => {
    const launchOptions = { headless: false, chromium: { headless: true } }
    const options = getBrowserOptions(FIREFOX, launchOptions)
    expect(options).toStrictEqual({ headless: false })
  })

  it('should not mutate original options', () => {
    const launchOptions = { headless: false, chromium: { headless: true } }
    const options = getBrowserOptions(FIREFOX, launchOptions)
    expect(options).toStrictEqual({ headless: false })
    expect(launchOptions).toStrictEqual({
      headless: false,
      chromium: { headless: true },
    })
  })
})

describe('checkBrowserEnv', () => {
  it('should throw Error with unknown type', async () => {
    const browserType = getBrowserType('unknown' as BrowserType)
    expect(() => checkBrowserEnv(browserType)).toThrow()
  })
})

describe('checkDeviceEnv', () => {
  it('should throw Error with unknown type', async () => {
    const device = 'unknown'
    const devices = ['iPhone 11', 'Pixel 2', 'Nexus 4']
    expect(() => checkDeviceEnv(device, devices)).toThrow()
  })
})

describe('checkDevice', () => {
  const devices = {
    'iPhone 11': {},
    'Pixel 2': {},
    'Nexus 4': {},
  } as Playwright['devices']

  it('should not throw Error if device is exist', async () => {
    const device = 'Nexus 4'
    expect(() => checkDevice(device, devices)).not.toThrow()
  })

  it('should not throw Error if device is not string', async () => {
    const device = null
    expect(() => checkDevice(device, devices)).not.toThrow()
  })

  it('should throw Error with unknown type', async () => {
    const device = 'unknown'
    expect(() => checkDevice(device, devices)).toThrow()
  })
})

describe('getDeviceBrowserType', () => {
  const devices = {
    'iPhone 11': {
      defaultBrowserType: 'webkit',
    },
  } as Playwright['devices']

  it('should return "chromium" as default', async () => {
    const device = {
      name: 'Custom',
    }
    expect(getDeviceBrowserType(device, devices)).toBe(CHROMIUM)
  })

  it('should return default browser if it is defined', async () => {
    const device = {
      name: 'Custom',
      defaultBrowserType: FIREFOX as BrowserType,
    }
    expect(getDeviceBrowserType(device, devices)).toBe(FIREFOX)
  })

  it('should return default browser for string device', async () => {
    expect(getDeviceBrowserType('iPhone 11', devices)).toBe('webkit')
  })
})

describe('getSkipFlag', () => {
  it('should return true if skipOption.browsers includes browserName', async () => {
    const skipOptions = { browsers: [CHROMIUM as BrowserType] }
    const skipFlag = getSkipFlag(skipOptions, CHROMIUM, null)
    expect(skipFlag).toBe(true)
  })

  it('should return false if skipOption.browsers does not include browserName', async () => {
    const skipOptions = { browsers: [CHROMIUM as BrowserType] }
    const skipFlag = getSkipFlag(skipOptions, FIREFOX, null)
    expect(skipFlag).toBe(false)
  })

  it('should return true if skipOption.browser includes browserName & skipOption.devices includes deviceName', async () => {
    const skipOptions = {
      browsers: [CHROMIUM as BrowserType],
      devices: /Pixel/,
    }
    const skipFlag = getSkipFlag(skipOptions, CHROMIUM, 'Pixel 2')
    expect(skipFlag).toBe(true)
  })

  it('should return true if skipOption.devices is RegExp and match to deviceName', async () => {
    const skipOptions = {
      browsers: [CHROMIUM as BrowserType],
      devices: ['Pixel 2'],
    }
    const skipFlag = getSkipFlag(skipOptions, CHROMIUM, 'Pixel 2')
    expect(skipFlag).toBe(true)
  })

  it('should return false if skipOption.browser does not include browserName & skipOption.devices includes deviceName', async () => {
    const skipOptions = {
      browsers: [CHROMIUM as BrowserType],
      devices: ['Pixel 2'],
    }
    const skipFlag = getSkipFlag(skipOptions, FIREFOX, 'Pixel 2')
    expect(skipFlag).toBe(false)
  })

  it('should return false if skipOption.browser does not includes browserName & skipOption.devices does not include deviceName', async () => {
    const skipOptions = {
      browsers: [CHROMIUM as BrowserType],
      devices: ['Pixel 2'],
    }
    const skipFlag = getSkipFlag(skipOptions, FIREFOX, null)
    expect(skipFlag).toBe(false)
  })
})

describe('getPlaywrightInstance', () => {
  it('should return all instances from playwright package', async () => {
    jest.doMock('playwright', () => ({
      firefox: 'firefox',
      chromium: 'chromium',
    }))

    const { instance } = getPlaywrightInstance()
    expect(instance).toEqual({
      firefox: 'firefox',
      chromium: 'chromium',
    })
  })

  it('should return specified instance from playwright package', async () => {
    jest.doMock('playwright', () => ({
      firefox: 'firefox',
      chromium: 'chromium',
    }))

    const { instance } = getPlaywrightInstance('firefox')
    expect(instance).toEqual('firefox')
  })

  it('should return specified instance from specified playwright package', () => {
    jest.doMock('playwright-chromium', () => ({
      chromium: 'chromium',
    }))

    const { instance } = getPlaywrightInstance('chromium')
    expect(instance).toEqual('chromium')
  })

  it('should throw error when playwright package is not provided', () => {
    jest.doMock('playwright', () => ({
      chromium: 'chromium',
    }))

    const getMissedPlaywrightInstance = () => getPlaywrightInstance('firefox')

    expect(getMissedPlaywrightInstance).toThrowError(
      'jest-playwright-preset: Cannot find playwright package to use firefox',
    )
  })
})

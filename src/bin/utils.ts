import { checkBrowserEnv } from '../utils'
import { BrowserType } from '../constants'

export const checkCommand = (
  browsers: BrowserType[],
  devices: string[],
): void => {
  if (!browsers.length && !devices.length) {
    throw new Error(
      'You should define browsers or devices with your jest-playwright.config.js',
    )
  }
  browsers.forEach(checkBrowserEnv)
  // TODO Add check for devices
  // devices.forEach(checkDeviceEnv)
}

export const getDisplayName = (
  browser: BrowserType,
  device: string | null,
): string => {
  return `browser: ${browser}${device ? ` device: ${device}` : ''}`
}

export const getExitCode = (exitCodes: (number | null)[]): void => {
  if (exitCodes.every(code => code === 0)) {
    process.exit(0)
  } else {
    console.log('One of the test has not passed successfully')
    process.exit(1)
  }
}

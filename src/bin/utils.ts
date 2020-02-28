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

export const getResultByStatus = (status: number | null): string => {
  return status !== 0 ? 'Failed' : 'Passed'
}

export const getLogMessage = (
  browser: BrowserType,
  status: number | null,
  device: string | null,
): string => {
  return `${getResultByStatus(status)} tests for browser: ${browser} ${
    device ? `and device: ${device}` : ''
  }\n\n`
}

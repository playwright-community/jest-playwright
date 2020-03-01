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

export const getExitCode = (exitCodes: (number | null)[]): void => {
  if (exitCodes.every(code => code === 0)) {
    process.exit(0)
  } else {
    console.log('One of the test has not passed successfully')
    process.exit(1)
  }
}

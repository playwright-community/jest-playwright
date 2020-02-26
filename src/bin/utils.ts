import { checkBrowserEnv } from '../utils'
import { BrowserType } from '../constants'

export const checkBrowsers = (browsers?: BrowserType[]): void => {
  if (!browsers || !browsers.length) {
    throw new Error(
      'You should define browsers with your jest-playwright.config.js',
    )
  }
  browsers.forEach(checkBrowserEnv)
}

export const getResultByStatus = (status: number | null): string => {
  return status !== 0 ? 'Failed' : 'Passed'
}

export const getLogMessage = (
  browser: BrowserType,
  status: number | null,
  device: string | null,
) => {
  return `${getResultByStatus(status)} tests for browser: ${browser} ${
    device ? `and device: ${device}` : ''
  }\n\n`
}

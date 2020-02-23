import { checkBrowserEnv } from '../utils'
import { BrowserType } from '../constants'

/* eslint import/prefer-default-export:0 */
export function checkBrowsers(browsers?: BrowserType[]) {
  if (!browsers || !browsers.length) {
    throw new Error(
      'You should define browsers with your jest-playwright.config.js',
    )
  }
  browsers.forEach(checkBrowserEnv)
}

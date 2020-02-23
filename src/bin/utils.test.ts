import { checkBrowsers } from './utils'
import { BrowserType } from '../constants'

describe('checkBrowsers', () => {
  it('should throw an error without arguments', () => {
    expect(() => checkBrowsers()).toThrow(
      'You should define browsers with your jest-playwright.config.js',
    )
  })
  it('should throw an error when passed empty array', () => {
    expect(() => checkBrowsers([])).toThrow(
      'You should define browsers with your jest-playwright.config.js',
    )
  })
  it('should throw an error when passed wrong browser', () => {
    expect(() => checkBrowsers(['chromium', 'unknown' as BrowserType])).toThrow()
  })
})

import { checkBrowsers, getResultByStatus, getLogMessage } from './utils'
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
    expect(() =>
      checkBrowsers(['chromium', 'unknown' as BrowserType]),
    ).toThrow()
  })
})

describe('getResultByStatus', () => {
  it('should return "Failed" if passed null', () => {
    expect(getResultByStatus(null)).toBe('Failed')
  })

  it('should return "Failed" if passed code 1', () => {
    expect(getResultByStatus(1)).toBe('Failed')
  })

  it('should return "Passed" if passed code 0', () => {
    expect(getResultByStatus(0)).toBe('Passed')
  })
})

describe('getLogMessage', () => {
  it('should return right log', () => {
    expect(getLogMessage('chromium', 0, null)).toBe(
      'Passed tests for browser: chromium \n\n',
    )
  })

  it('should return right log', () => {
    expect(getLogMessage('chromium', 1, 'iPhone 6')).toBe(
      'Failed tests for browser: chromium and device: iPhone 6\n\n',
    )
  })
})

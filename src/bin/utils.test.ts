import { checkBrowsers, getResultByStatus } from './utils'
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

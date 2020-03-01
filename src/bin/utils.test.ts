import {
  checkCommand,
  getResultByStatus,
  getLogMessage,
  getExitCode,
} from './utils'
import { BrowserType } from '../constants'

describe('checkCommand', () => {
  it('should throw an error with empty browsers and devices', () => {
    expect(() => checkCommand([], [])).toThrow(
      'You should define browsers or devices with your jest-playwright.config.js',
    )
  })

  it('should throw an error when passed wrong browser', () => {
    expect(() => checkCommand(['unknown' as BrowserType], [])).toThrow()
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

describe('getExitCode', () => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
    return undefined as never
  })

  it('should exit with code 1 for some failed tests', () => {
    getExitCode([0, 0, 1, null])
    expect(mockExit).toHaveBeenCalledWith(1)
  })

  it('should exit with code 0 for passed tests', () => {
    getExitCode([0, 0, 0, 0])
    expect(mockExit).toHaveBeenCalledWith(0)
  })
})

import { checkCommand, getExitCode } from './utils'
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

import { Config } from './types'

export const IMPORT_KIND_PLAYWRIGHT = 'playwright'

export const CHROMIUM = 'chromium'
export const FIREFOX = 'firefox'
export const WEBKIT = 'webkit'

export const DEFAULT_CONFIG: Config = {
  launchBrowserApp: {},
  context: {},
  browsers: [CHROMIUM],
  devices: [],
  exitOnPageError: true,
}

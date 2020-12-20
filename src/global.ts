/* eslint-disable no-console */
import {
  setup as setupServer,
  teardown as teardownServer,
  ERROR_TIMEOUT,
  ERROR_NO_COMMAND,
} from 'jest-process-manager'
import { readConfig } from './utils'
import type { Config as JestConfig } from '@jest/types'

let didAlreadyRunInWatchMode = false

const logMessage = ({
  message,
  action,
}: {
  message: string
  action: string
}): void => {
  console.log('')
  console.error(message)
  console.error(`\n☝️ You ${action} in jest-playwright.config.js`)
  process.exit(1)
}

export async function setup(
  jestConfig: JestConfig.GlobalConfig,
): Promise<void> {
  // TODO It won't work if config doesn't exist in root directory or in jest.config.js file
  const config = await readConfig(jestConfig.rootDir)

  // If we are in watch mode - only setupServer() once.
  if (jestConfig.watch || jestConfig.watchAll) {
    if (didAlreadyRunInWatchMode) return
    didAlreadyRunInWatchMode = true
  }

  if (config.serverOptions) {
    try {
      await setupServer(config.serverOptions)
    } catch (error) {
      if (error.code === ERROR_TIMEOUT) {
        logMessage({
          message: error.message,
          action: 'can set "serverOptions.launchTimeout"',
        })
      }
      if (error.code === ERROR_NO_COMMAND) {
        logMessage({
          message: error.message,
          action: 'must set "serverOptions.command"',
        })
      }
      throw error
    }
  }
}

export async function teardown(
  jestConfig: JestConfig.GlobalConfig,
): Promise<void> {
  if (!jestConfig.watch && !jestConfig.watchAll) {
    await teardownServer()
  }
}

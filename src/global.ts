/* eslint-disable no-console */
import {
  setup as setupServer,
  teardown as teardownServer,
  ERROR_TIMEOUT,
  ERROR_NO_COMMAND,
} from 'jest-dev-server'
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

export async function setup(jestConfig: JestConfig.GlobalConfig) {
  const config = await readConfig(jestConfig.rootDir)

  // If we are in watch mode, - only setupServer() once.
  if (jestConfig.watch || jestConfig.watchAll) {
    if (didAlreadyRunInWatchMode) return
    didAlreadyRunInWatchMode = true
  }

  if (config.server) {
    try {
      await setupServer(config.server)
    } catch (error) {
      if (error.code === ERROR_TIMEOUT) {
        logMessage({
          message: error.message,
          action: 'can set "server.launchTimeout"',
        })
      }
      if (error.code === ERROR_NO_COMMAND) {
        logMessage({
          message: error.message,
          action: 'must set "server.command"',
        })
      }
      throw error
    }
  }
}

export async function teardown(jestConfig: JestConfig.GlobalConfig) {
  if (!jestConfig.watch && !jestConfig.watchAll) {
    await teardownServer()
  }
}

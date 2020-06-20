import * as uuid from 'uuid'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import rimraf from 'rimraf'
const fsAsync = fs.promises
import { Page } from 'playwright-core'

// @ts-ignore
import NYC from 'nyc'

const NYC_DIR = '.nyc_output'
const COV_MERGE_DIR = path.join(NYC_DIR, 'merge')

const cleanMergeFiles = async (): Promise<void> => {
  await promisify(rimraf)(COV_MERGE_DIR)
}

export const setupCoverage = async (): Promise<void> => {
  if (!fs.existsSync(NYC_DIR)) {
    await fsAsync.mkdir(NYC_DIR)
  }
  await cleanMergeFiles()
  await fsAsync.mkdir(COV_MERGE_DIR)
}

export const saveCoverage = async (page: Page): Promise<void> => {
  const coverage = await page.evaluate(`window.__coverage__`)
  if (coverage) {
    await fsAsync.writeFile(
      path.join(COV_MERGE_DIR, `${uuid.v4()}.json`),
      JSON.stringify(coverage),
    )
  }
}

export const mergeCoverage = async (): Promise<void> => {
  const nyc = new NYC({
    _: ['merge'],
  })
  const map = await nyc.getCoverageMapFromAllCoverageFiles(COV_MERGE_DIR)
  const outputFile = path.join(NYC_DIR, 'coverage.json')
  const content = JSON.stringify(map, null, 2)
  await fsAsync.writeFile(outputFile, content)
  console.info(
    `Coverage file (${content.length} bytes) written to ${outputFile}`,
  )
  await cleanMergeFiles()
}
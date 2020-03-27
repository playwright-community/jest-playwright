#!/usr/bin/env node

import runner from './testProcess'

const [, , ...args] = process.argv

const run = async (params: string[]): Promise<void> => {
  const sequence = params.find((param) => param.startsWith('--')) || ''
  const jestParams = params.filter((param) => param !== sequence)
  await runner(sequence, jestParams)
}

run(args)

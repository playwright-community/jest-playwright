module.exports = {
  preset: 'ts-jest',
  testEnvironment: './lib/PlaywrightEnvironment.js',
  testSequencer: './lib/PlaywrightTestSequencer.js',
  runner: './runner.js',
  testPathIgnorePatterns: ['/node_modules/', 'lib'],
  testMatch: ['**/e2e/**/*.test.ts'],
  setupFilesAfterEnv: ['./extends.js'],
  verbose: true,
}

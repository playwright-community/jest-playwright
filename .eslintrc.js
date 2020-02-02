module.exports = {
  root: true,
  extends: ['airbnb-base', 'prettier'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  env: {
    node: true,
    jest: true,
    browser: true,
  },
  globals: {
    page: true,
    browser: true,
    context: true,
  },
}

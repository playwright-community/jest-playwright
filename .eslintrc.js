module.exports = {
  root: true,
  extends: ['airbnb-base', 'prettier'],
  plugins: ['eslint-plugin-prettier'],
  rules: {
    'global-require': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-dynamic-require': 'off',
    'import/no-unresolved': 'off',
    'prettier/prettier': 'error',
  },
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

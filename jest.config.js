module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testPathIgnorePatterns: [
    '<rootDir>/Frontend/',
  ],
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './tests/coverage',
      filename: 'report.html',
      expand: true
    }]
  ],
};
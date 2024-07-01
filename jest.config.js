module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['lib/**/*.ts'],
  transform: { '\\.ts$': ['ts-jest'] },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'coverage'],
}

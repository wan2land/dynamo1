module.exports = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: '[^/]*\\.test.tsx?$',
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
  ],
  setupFiles: ['core-js'],
  setupFilesAfterEnv: ['./test/setup.js'],
}

module.exports = {
  preset: '@react-native/jest-preset',
  testMatch: ['<rootDir>/tests/native/**/*.test.tsx'],
  maxWorkers: 2,
  transform: { '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['module:@react-native/babel-preset'] }] },
  transformIgnorePatterns: ['node_modules/(?!((?:\\.pnpm/)?(?:react-native|@react-native|@react-native-community)[^/]*))'],
};

import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest  = {
  // [...]
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  setupFiles: ["dotenv/config"]
};

export default jestConfig;

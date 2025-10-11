import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  setupFilesAfterEnv: [],
  globalSetup: "<rootDir>/__tests__/setup.ts",
  globalTeardown: "<rootDir>/__tests__/setup.ts",
  testTimeout: 30000,
  // Executar testes sequencialmente para evitar conflitos de banco
  maxWorkers: 1,
};

export default config;

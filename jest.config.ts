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
  testTimeout: 30000,
};

export default config;

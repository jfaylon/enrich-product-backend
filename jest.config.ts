import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts"],
  roots: ["<rootDir>/test", "<rootDir>/src"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  setupFilesAfterEnv: ["./test/config/setup.ts"],
  collectCoverageFrom: ["<rootDir>/src/**/*.ts"],
};

export default config;

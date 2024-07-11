// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.test.(js|jsx|ts|tsx)"],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
};

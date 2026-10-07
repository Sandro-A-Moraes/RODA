module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/core/(.*)$': '<rootDir>/src/core/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/modules/(.*)$': '<rootDir>/src/modules/$1',
  },
};

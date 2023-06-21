module.exports = {
    roots: ['<rootDir>'],
    clearMocks: true,
    testMatch: ['**/(__tests__|src)/**/?(*.)+(spec|test).+(ts|tsx|js)'],
    transform: {
        '^.+\\.(ts|tsx)?$': 'ts-jest',
        // make sure Jest accepts imports of assets, including TTL
        '^.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2|ttl)$': 'jest-transform-stub'
    },
    modulePathIgnorePatterns: ['dist/'],
    testPathIgnorePatterns: [
        '/node_modules/',
        // By default we only run unit tests:
        'e2e/*'
    ],

    // Read .env files to configure tests (e.g. read test tokens from local config)
    //setupFiles: ['dotenv/config'],

    collectCoverageFrom: [
        '**/src/**/*.ts',
        '!**/node_modules/**',
        '!**/__tests__/**',
        '!**/src/external-types/**',
        '!**/src/index.ts',
        '!**/dist/**',
        '!**/*.spec.ts'
    ]
};

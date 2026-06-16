const path = require('path');

module.exports = {
    testEnvironment: 'node',
    globalSetup: path.join(process.cwd(), '__test__', 'env.setup.js'),
    setupFilesAfterEnv: [path.join(process.cwd(), '__test__', 'jest.setup.js')],
    roots: ['<rootDir>/__test__'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/Front/'
    ]
};

export default {
    collectCoverage: true,
    collectCoverageFrom: [
        "<rootDir>/src/**/*",
    ],
    coveragePathIgnorePatterns: [
        "<rootDir>/src/Mapillary.js",
        "<rootDir>/src/export/",
        "interfaces"
    ],
    coverageProvider: "v8",
    moduleDirectories: [
        "node_modules",
    ],
    moduleFileExtensions: [
        "js",
    ],
    rootDir: "build/cjs",
    slowTestThreshold: 1,
    watchman: false,
};

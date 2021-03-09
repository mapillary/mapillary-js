export default {
    collectCoverage: true,
    collectCoverageFrom: [
        "<rootDir>/esm/src/**/*",
    ],
    coveragePathIgnorePatterns: [
        "node_modules/",
        "build/esm/src/Mapillary.js",
        "build/esm/src/export/",
    ],
    coverageProvider: "v8",
    moduleDirectories: [
        "node_modules",
    ],
    moduleFileExtensions: [
        "js",
    ],
    rootDir: "build",
    slowTestThreshold: 1,
    watchman: false,
};

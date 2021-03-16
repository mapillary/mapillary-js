export default {
    collectCoverage: true,
    collectCoverageFrom: [
        "<rootDir>/src/**/*",
    ],
    coveragePathIgnorePatterns: [
        "<rootDir>/src/api/ents/",
        "<rootDir>/src/export/",
        "<rootDir>/src/component/shaders/",
        "<rootDir>/src/Mapillary.js",
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

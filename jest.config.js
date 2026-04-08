export default {
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/src/**/*"],
  coveragePathIgnorePatterns: [
    "<rootDir>/src/api/contracts/",
    "<rootDir>/src/api/ents/",
    "<rootDir>/src/export/",
    "<rootDir>/src/component/shaders/",
    "<rootDir>/src/mapillary.js",
    "<rootDir>/src/viewer/events/",
    "<rootDir>/src/viewer/options/",
    "interfaces",
  ],
  coverageProvider: "babel",
  moduleDirectories: ["node_modules"],
  moduleFileExtensions: ["js"],
  rootDir: "build/cjs",
  slowTestThreshold: 1,
  testEnvironment: "jsdom",
  testRunner: "jest-jasmine2",
  transform: {
    "\\.[jt]sx?$": ["babel-jest", { configFile: "<rootDir>/../../babel.config.json" }],
  },
  moduleNameMapper: {
    "^martinez-polygon-clipping$":
      "<rootDir>/../../node_modules/martinez-polygon-clipping/dist/martinez.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(earcut|pbf|polylabel|tinyqueue|rbush|quickselect|martinez-polygon-clipping|splaytree|robust-predicates)/)",
  ],
  watchman: false,
};

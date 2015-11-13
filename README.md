# mapillary-js
Mapillary WebGL Viewer

## Developing mapillary-js

The following tools are required on any platform to develop `mapillary-js`.

- git
- node.js

To install dependencies

```
$ npm install
```

Development mode

```
$ gulp
```

Then head to `http://localhost:3000/debug/` to debug

## Gulp Commands

### gulp watch

Serve and constantly rebuild.

### gulp test

Run single test one time

### gulp test-watch

Keep karma browser open and rerun tests upon changes in project files


## Project Structure
```
.
├── build/               - Development folder
├── debug/               - Access at localhost:3000/debug after `gulp`
├── dist/                - Distribution: CSS and other assets
├── spec/                - Tests
│   ├── Viewer.spec.ts
│   └── viewer
│       ├── OptionsParser.spec.ts
│       └── Prefetcher.spec.ts
├── src/
│   ├── Mapillary.ts   - Main file
│   ├── Utils.ts       - Utility classes
│   ├── *.ts           - One file per class
│   └── api            - One folder per class
│       ├── interfaces
│       │   ├── IAPINavIm.ts
│       │   ├── IAPINavImIm.ts
│       │   ├── IAPINavImS.ts
│       │   └── interfaces.ts
│       ├── APINav.ts
│       ├── APIv2.ts
│       └── APIv2Call.ts
├── typings/
├── Gulpfile.js
├── karma.conf.js
├── package.json
├── tsd.json
├── tslint.json
└── README.md
```
## Preparing your Development Environment

### Linux

Install [GNU Make](http://www.gnu.org/software/make/) and [git](https://git-scm.com/):
```bash
sudo apt-get update
sudo apt-get install build-essential git
```

Install [node.js](https://nodejs.org/) _5.x_ and [npm](https://www.npmjs.com/) according to the [node.js package manager installation instructions](https://nodejs.org/en/download/package-manager/).

Clone a copy of the repo:
```bash
git clone https://github.com/mapillary/mapillary-js.git
```

Change to the mapillary-js directory and install node module dependencies:
```bash
cd mapillary-js
npm install
```

### OSX

Install the Command Line Tools for Xcode:

```bash
xcode-select --install
```

Install [Homebrew](http://brew.sh/) according to the instructions.

Install [node.js](https://nodejs.org/):
```bash
brew install node
```

Clone a copy of the repo:
```bash
git clone https://github.com/mapillary/mapillary-js.git
```

Change to the mapillary-js directory and install node module dependencies:
```bash
cd mapillary-js
npm install
```

## Serving the Debug Page

```bash
npm run gulp
```

Open the debug page at [http://localhost:3000](http://localhost:3000).

## Running Tests

```bash
npm run gulp test
```

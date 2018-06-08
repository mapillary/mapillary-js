Thanks in advance for contributing to MapillaryJS. Please follow the conventions below when submitting an issue or pull request.

## Preparing your Development Environment

### Linux

Install [GNU Make](http://www.gnu.org/software/make/) and [git](https://git-scm.com/):
```bash
sudo apt-get update &&
sudo apt-get install build-essential git
```

Install [node.js](https://nodejs.org/) _10.x_ and [npm](https://www.npmjs.com/) according to the [node.js package manager installation instructions](https://nodejs.org/en/download/package-manager/).

Clone a copy of the repo:
```bash
git clone https://github.com/mapillary/mapillary-js.git
```

Change to the mapillary-js directory and install node module dependencies:
```bash
cd mapillary-js &&
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
cd mapillary-js &&
npm install
```

## Serving the Debug Page

```bash
npm start
```

Open the debug page at [http://localhost:3000](http://localhost:3000).

## Creating a Standalone Build

A standalone build allows you to turn the MapillaryJS repository content into files that can be included on an html page.

To create a standalone build, run

```bash
npm prepare
```

Once that command finishes, you will have a standalone build at dist/mapillary.min.js and dist/mapillary.min.css together with the the dist/*.svg files.

## Running Tests

```bash
npm test
```

## Building and serving the docs

```bash
npm run build-docs &&
python -m SimpleHTTPServer
````

Open the docs page at [http://localhost:8000/docs](http://localhost:8000/docs).

## Commit conventions

We use the standardized commit messages according to [Conventional Commits](https://conventionalcommits.org/) with the additional types in the Angular convention.

## Version Control Conventions

We use [rebase merging](https://git-scm.com/book/en/v2/Git-Branching-Rebasing) (as opposed to [basic merging](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging#Basic-Merging)) to merge branches.


Thanks in advance for contributing to MapillaryJS. Please follow the conventions below when submitting an issue or pull request.

## [Code of Conduct](https://code.facebook.com/codeofconduct)

Facebook has adopted the [Contributor Covenant](https://www.contributor-covenant.org/) as its Code of Conduct, and we expect project participants to adhere to it. Please read [the full text](.CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

## Contribution Prerequisites
- You have [Node](https://nodejs.org) installed at v10.0.0+ and [Yarn](https://classic.yarnpkg.com) at v1.2.0+.
- You are familiar with [Git](https://git-scm.com/).

## Sending a Pull Request
We will review your pull request and either merge it, request changes to it, or close it with an explanation. We’ll do our best to provide updates and feedback throughout the process.

**Before submitting a pull request**, please make sure the following is done:

1. Fork [the repository](https://github.com/mapillary/mapillary-js) and create your branch from `master`.
2. Run `yarn` in the repository root.
3. If you’ve fixed a bug or added code that should be tested, add tests!
4. Ensure the test suite passes (`yarn test`).
5. Make sure your code lints (`yarn lint`).
6. If you haven’t already, complete the CLA.

## Contributor License Agreement (CLA)
In order to accept your pull request, we need you to submit a CLA. You only need to do this once, so if you’ve done this for another Facebook open source project, you’re good to go. If you are submitting a pull request for the first time, just let us know that you have completed the CLA and we can cross-check with your GitHub username.

[Complete your CLA here.](https://code.facebook.com/cla)

## Develop with Docker
1. Install [Docker](https://www.docker.com/).
2. Clone the repository.
3. Build the mapillary-js image:

```zsh
docker build -t mapillary-js .
```

4. Create a mapillary-js container and run it interactively:

```zsh
docker run -v "$(pwd)":/source/mapillary-js -p 8000:8000 --name mapillary-js-container -it mapillary-js

```

5. [Stop](https://docs.docker.com/engine/reference/commandline/stop/), [start](https://docs.docker.com/engine/reference/commandline/start/), and [attach](https://docs.docker.com/engine/reference/commandline/exec/) to the container.

## Development Workflow
After cloning MapillaryJS, run `yarn` to fetch its dependencies. Then, you can run several commands:

- `yarn lint` checks the code style.
- `yarn test` runs the complete test suite.
- `yarn test-watch` runs an interactive test watcher.
- `yarn build` creates a `dist` folder with the package.
- `yarn build-docs` builds the documentation in the `docs/build` folder.

We recommend running `yarn test` to make sure you don’t introduce any regressions as you work on your change.

The easiest way to try your changes is to run `yarn start` and open the debug page at [http://localhost:3000](http://localhost:3000).

However it can be handy to try your build of MapillaryJS in a real project. First, run `yarn build`. This will produce pre-built bundles in the `dist` folder.

If you want to try your changes in your existing project, you may copy `dist/mapillary.js`, `dist/mapillary.js.map`, and `dist/mapillary.min.css` into your app and use them instead of the stable version.

## Commit conventions

We use the standardized commit messages according to [Conventional Commits](https://conventionalcommits.org/) with the additional types in the Angular convention.

## Version Control Conventions

We use [rebase merging](https://git-scm.com/book/en/v2/Git-Branching-Rebasing) (as opposed to [basic merging](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging#Basic-Merging)) to merge branches.

## License

By contributing to MapillaryJS, you agree that your contributions will be licensed under its MIT license.

# MapillaryJS Documentation

This website is built using [Docusaurus 2](https://docusaurus.io/).

## Development Workflow

After cloning MapillaryJS, run `yarn install` in this directory to fetch the documentation dependencies. Then, you can run several commands:

- `yarn ci` check for linting/formatting issues.
- `yarn build-mods` builds the `mapillary-js` library and copies module dependencies used in examples into the `mods` directory. This step is required for building the docs.
- `yarn start-docs` starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server. It omits the API and examples sections for faster iteration. It omits the API and examples sections for faster iteration.
- `yarn build` generates static content into the `build` directory and can be served using any static contents hosting service.
- `yarn serve` serves the static content in the `build` directory.
- `yarn build-api` builds the API reference in the `doc/api` folder spearately. Running this command is not needed for building the static documentation.
- `yarn clear` removes the doc build output.

## Deployment

Push to the `gh-pages` branch.

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

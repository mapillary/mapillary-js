# MapillaryJS Documentation

This website is built using [Docusaurus 2](https://docusaurus.io/).

## Development Workflow

After cloning MapillaryJS, run `yarn install && yarn install-mjs` in this directory to fetch the documentation dependencies. Then, you can run several commands:

- `yarn build` generates static content into the `build` directory and can be served using any static contents hosting service.
- `yarn serve` serves the static content in the `build` directory. Navigate to `http://localhost:3000/mapillary-js` to view the documentation.
- `yarn start` starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server. It omits the API and examples sections for faster iteration.
- `yarn build-api` builds the API reference in the `doc/api` folder spearately. Running this command is not needed for building the static documentation.
- `yarn ci` check for linting/formatting issues.
- `yarn clear` removes the doc build output.
- `yarn install-mjs` builds the `mapillary-js` library and copies its distribution to the `src/mapillary-js` directory. This step is required for building the docs.

## Deployment

Push to the `gh-pages` branch.

```
$ GIT_USER=<your GitHub username> yarn deploy
```

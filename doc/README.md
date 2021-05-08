# MapillaryJS documentation

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

## Development Workflow
After cloning MapillaryJS, run `yarn install` in this directory to fetch the documentation dependencies. Then, you can run several commands:

- `yarn start` starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.
- `yarn build` generates static content into the `build` directory and can be served using any static contents hosting service.
- `yarn ci` check for linting/formatting issues.

## Deployment

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

```
$ GIT_USER=<Your GitHub username> USE_SSH=true yarn deploy
```

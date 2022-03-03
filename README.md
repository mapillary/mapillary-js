[![GitHub workflow](https://github.com/mapillary/mapillary-js/workflows/Build/badge.svg)](https://github.com/mapillary/mapillary-js/actions?query=branch%3Amain)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/mapillary/mapillary-js/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/mapillary-js.svg?style=flat)](https://www.npmjs.com/package/mapillary-js)

# MapillaryJS

MapillaryJS is a client-side JavaScript library for interactive, extendable street imagery map experiences on the web. It takes spatial, semantic, and texture data and renders it using WebGL. MapillaryJS can be customized with camera controls, user interactivity, and data providers and it can be augmented with geospatial rendering, animation, and content placement.

<a href="https://www.mapillary.com">
<img width="100%" alt="Mapillary" src="https://user-images.githubusercontent.com/2492302/117429732-9dbe1e80-af27-11eb-9531-47ae4df50c65.png">
</a>

## Installation and Usage

To start using MapillaryJS with data from the [Mapillary](https://www.mapillary.com) platform, you need an [account](https://www.mapillary.com/app/?login=true). When signed in, you need to [register an application](https://www.mapillary.com/dashboard/developers) to get a [client access token](https://www.mapillary.com/dashboard/developers). When [providing your own data](https://mapillary.github.io/mapillary-js/docs/extension/extend), no access token is needed.

<details open>
  <summary><b><code>ES6 bundler</code></b></summary>

Install the package via [Yarn](https://classic.yarnpkg.com) (or [npm](https://docs.npmjs.com/about-npm)).

```sh
yarn add mapillary-js
```

Use a CSS loader or include the CSS file in the `<head>` of your HTML file.

```html
<link
  href="https://unpkg.com/mapillary-js@4.1.0/dist/mapillary.css"
  rel="stylesheet"
/>
```

Include the following code in your JavaScript file.

```js
import { Viewer } from "mapillary-js";

const viewer = new Viewer({
  accessToken: "<your access token>",
  container: "<your HTML element ID>",
  imageId: "<your image ID for initializing the viewer>",
});
```

</details>

<details>
  <summary><b><code>TypeScript</code></b></summary>

Install the package via [Yarn](https://classic.yarnpkg.com) (or [npm](https://docs.npmjs.com/about-npm)).

```sh
yarn add mapillary-js
```

Use a CSS loader or include the CSS file in the `<head>` of your HTML file.

```html
<link
  href="https://unpkg.com/mapillary-js@4.1.0/dist/mapillary.css"
  rel="stylesheet"
/>
```

Include the following code in your TypeScript file.

```ts
import { Viewer, ViewerOptions } from "mapillary-js";

const options: ViewerOptions = {
  accessToken: "<your access token>",
  container: "<your HTML element ID>",
  imageId: "<your image ID for initializing the viewer>",
};
const viewer = new Viewer(options);
```

</details>

<details>
  <summary><b><code>CDN</code></b></summary>

Include the JavaScript and CSS files in the `<head>` of your HTML file.

```html
<script src="https://unpkg.com/mapillary-js@4.1.0/dist/mapillary.js"></script>
<link
  href="https://unpkg.com/mapillary-js@4.1.0/dist/mapillary.css"
  rel="stylesheet"
/>
```

Add a container to the `<body>` of your HTML file.

```html
<div id="mly" style="width: 400px; height: 300px;"></div>
```

The global [UMD](https://github.com/umdjs/umd) name for MapillaryJS is `mapillary`. Include the following script in the `<body>` of your HTML file.

```js
<script>
var { Viewer } = mapillary;

var viewer = new Viewer({
  accessToken: "<your access token>",
  container: "mly",
  imageId: "<your image ID for initializing the viewer>",
});
</script>
```

</details>

## Documentation

- [Getting Started with MapillaryJS](https://mapillary.github.io/mapillary-js/docs)
- [Developing Extensions](https://mapillary.github.io/mapillary-js/docs/extension/extend)
- [Examples](https://mapillary.github.io/mapillary-js/examples)
- [API Reference](https://mapillary.github.io/mapillary-js/api)
- [Migration Guide](https://mapillary.github.io/mapillary-js/docs/migration/v4)
- [Contribution Guidelines](./.github/CONTRIBUTING.md)

## Code of Conduct

Facebook has adopted the [Contributor Covenant](https://www.contributor-covenant.org/) as its [Code of Conduct](https://code.facebook.com/codeofconduct), and we expect project participants to adhere to it. Please read [the full text](./.github/CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

## License

MapillaryJS is [MIT licensed](./LICENSE).

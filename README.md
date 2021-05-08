[![GitHub workflow](https://github.com/mapillary/mapillary-js/workflows/Build/badge.svg)](https://github.com/mapillary/mapillary-js/actions?query=branch%3Amain)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/mapillary/mapillary-js/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/mapillary-js.svg?style=flat)](https://www.npmjs.com/package/mapillary-js)

# MapillaryJS

MapillaryJS is an interactive, customizable street imagery and semantic mapping visualization platform on the web. It takes spatial, semantic, and texture data and renders it using JavaScript and WebGL. It can be extended with custom data providers, 3D model rendering, camera controls, and interactivity.

<a href="https://www.mapillary.com">
<img width="100%" alt="Mapillary" src="https://user-images.githubusercontent.com/2492302/117429732-9dbe1e80-af27-11eb-9531-47ae4df50c65.png">
</a>

## Installation and usage

To get started using data from the [Mapillary](https://www.mapillary.com) platform, you need an [app token](). When [extending MapillaryJS]() to render your own data, no app token is needed.

<details open>
  <summary><b><code>ES6 bundler</code></b></summary>

Install the package via [Yarn](https://classic.yarnpkg.com) (or [npm](https://docs.npmjs.com/about-npm)).

```sh
yarn install mapillary-js
```

Use a CSS loader or include the CSS file in the `<head>` of your HTML file.

```html
<link href='https://unpkg.com/mapillary-js@4.0.0/dist/mapillary.css' rel='stylesheet' />
```

Include the following code in your JavaScript file.

```js
import { Viewer } from "mapillary-js";

const viewer = new Viewer({
    apiClient: '<your app token>',
    container: '<your HTML element ID>',
    imageId: '<your image ID for initializing the viewer>',
});
```
</details>

<details>
  <summary><b><code>TypeScript</code></b></summary>

Install the package via [Yarn](https://classic.yarnpkg.com) (or [npm](https://docs.npmjs.com/about-npm)).

```sh
yarn install mapillary-js
```

Use a CSS loader or include the CSS file in the `<head>` of your HTML file.

```html
<link href='https://unpkg.com/mapillary-js@4.0.0/dist/mapillary.css' rel='stylesheet' />
```

Include the following code in your TypeScript file.

```ts
import { Viewer, ViewerOptions } from "mapillary-js";

const options: ViewerOptions = {
    apiClient: '<your app token>',
    container: '<your HTML element ID>',
    imageId: '<your image ID for initializing the viewer>',
};
const viewer = new Viewer(options);
```
</details>

<details>
  <summary><b><code>CDN</code></b></summary>


Include the JavaScript and CSS files in the `<head>` of your HTML file.

```html
<script src='https://unpkg.com/mapillary-js@4.0.0/dist/mapillary.js'></script>
<link href='https://unpkg.com/mapillary-js@4.0.0/dist/mapillary.css' rel='stylesheet' />
```

The global [UMD](https://github.com/umdjs/umd) namespace for MapillaryJS is `mapillary`. Include the following code in your JavaScript file.

```js
var { Viewer } = mapillary;

var viewer = new Viewer({
    apiClient: '<your app token>',
    container: '<your HTML element ID>',
    imageId: '<your image ID for initializing the viewer>',
});
```
</details>

## Documentation

- [Getting started with MapillaryJS]()
- [Developing extensions]()
- [Examples]()
- [API reference](https://mapillary.github.io/mapillary-js)
- [Migration guide](./MIGRATING.md)
- [Contributor documentation](./.github/CONTRIBUTING.md)

## Code of Conduct

Facebook has adopted the [Contributor Covenant](https://www.contributor-covenant.org/) as its [Code of Conduct](https://code.facebook.com/codeofconduc), and we expect project participants to adhere to it. Please read [the full text](./.github/CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

## License

MapillaryJS is [MIT licensed](./LICENSE).

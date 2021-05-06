[![GitHub workflow](https://github.com/mapillary/mapillary-js/workflows/Build/badge.svg)](https://github.com/mapillary/mapillary-js/actions?query=branch%3Amain)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/mapillary/mapillary-js/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/mapillary-js.svg?style=flat)](https://www.npmjs.com/package/mapillary-js)

# MapillaryJS

MapillaryJS is an interactive, customizable, and extendable street imagery and 3D reconstruction visualization platform for the web. It takes 3D reconstruction data and images and renders them using JavaScript and WebGL.

[<img width="49%" alt="San Francisco on Mapillary.com" src="https://user-images.githubusercontent.com/2492302/40781267-834ef7d4-64db-11e8-8c4c-3e83f17ff7c8.png">](https://www.mapillary.com/app/?focus=photo&pKey=VKf9Ay98ubkclhS2cCEWDg) [<img width="49%" alt="Frigilana on Mapillary.com" src="https://user-images.githubusercontent.com/2492302/40781605-ccfbb5c4-64dc-11e8-9b89-02beb73449ec.png">](https://www.mapillary.com/app/?focus=photo&pKey=FjsftlSr2Vqigl8P2zpOAw)

## Installation and usage

### ES6 via [Yarn](https://classic.yarnpkg.com) (or [npm](https://docs.npmjs.com/about-npm))

Install the package.

```sh
yarn install mapillary-js
```

Use a CSS loader or include the CSS file in the `<head>` of your HTML file.

```html
<link href='https://unpkg.com/mapillary-js@4.0.0/dist/mapillary.css' rel='stylesheet' />
```

Include the following code in your JavaScript file.

```ts
import { Viewer } from "mapillary-js";

const viewer = new Viewer({
    apiClient: '<your client ID>',
    container: '<your HTML element ID>',
    imageId: '<your image ID for initializing the viewer>',
});

```

### CDN

Include the JavaScript and CSS files in the `<head>` of your HTML file.

```html
<script src='https://unpkg.com/mapillary-js@4.0.0/dist/mapillary.js'></script>
<link href='https://unpkg.com/mapillary-js@4.0.0/dist/mapillary.css' rel='stylesheet' />
```

The global namespace for MapillaryJS is `mapillary`:

```js
var { Viewer } = mapillary;

var viewer = new Viewer({
    apiClient: '<your client ID>',
    container: '<your HTML element ID>',
    imageId: '<your image ID for initializing the viewer>',
});

```

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

# mapillary-js [![Build Status](https://circleci.com/gh/mapillary/mapillary-js.svg?style=svg)](https://circleci.com/gh/mapillary/mapillary-js)

WebGL JavaScript library for displaying street level imagery from [Mapillary](https://www.mapillary.com)


<img style="max-width: 45%; height: auto;" src="https://raw.githubusercontent.com/mapillary/mapillary-js/master/docs/assets/media/mapillary-js-preview-01.jpg" />
<img style="max-width: 45%; height: auto;" src="https://raw.githubusercontent.com/mapillary/mapillary-js/master/docs/assets/media/mapillary-js-preview-02-detections-ui.jpg" />

> **ATTENTION! This is an early alpha release, expect the APIs to change and some things to break.**

## Installation
To install the latest version

`npm install --save mapillary-js`

## Documentation
- [Developing mapillary-js](https://github.com/mapillary/mapillary-js/blob/master/docs/developing.md)
- [Extending mapillary-js with plugins](https://github.com/mapillary/mapillary-js/blob/master/docs/plugins.md)
- [Glossary](https://github.com/mapillary/mapillary-js/blob/master/docs/glossary.md)
- [API Reference](https://mapillary.github.io/mapillary-js)

## Examples
- [mapillary-js + Leaflet + Tangram](http://bl.ocks.org/knikel/fbeda1c8f89c97612b10)
- [mapillary-js + Leaflet](http://bl.ocks.org/knikel/f04c4656d1adeaaf1555)
- [mapillary-js + mapbox-gl-js](http://bl.ocks.org/knikel/4ec4de69a0fc29318675)
- [mapillary-js + Esri Leaflet](http://bl.ocks.org/knikel/e85b802e97fd3390668f)
- [mapillary-js + Google Maps](http://bl.ocks.org/knikel/451e2ee5d76ae72e669f)

## Quickstart

Before you start using `mapillary-js` you need somewhere to display it, create an `index.html` file with the following structure

```html
<!doctype html>
<html>
  <head>
    <meta charset=utf-8>
    <title>mapillary-js preview</title>
    <link rel="stylesheet" href="../node_modules/mapillary-js/dist/mapillary-js.css" />
  </head>
  <body>
    <div id="mly"></div>
    <script src="../node_modules/mapillary-js/dist/mapillary-js.min.js"></script>
    <script>
      // Our JavaScript lands here
    </script>
  </body>
</html>
```

`mapillary-js` requires a HTML element to initialize into, in our case it's a div with id `mly`. Next step is to initialize the viewer.

1. Since we'll be using Mapillary API, it's a requirement to obtain an API key. One can get it after signing up to Mapillary, and then going to [Settings/Integrations](https://www.mapillary.com/map/settings/integrations) and registering a new application (we don't need to select any scope permissions, since we only want read access to the data). We are interested in the `Client ID`'s value.
2. The viewer has to start somewhere, so we need to find a photoId that interests us. Each photo in on mapillary.com has a photo ID assigned to it. You can either copy the part from the url after `/im/` or select _Photo details_ and copy the photoId from there. If you'd like to start right away, try a panorama photo `ytfE1_iD_N-jmHfTHkj1Ug` from Saint-Denis, France or a perspective photo from Helsingborg, Sweden: `zarcRdNFZwg3FkXNcsFeGw`.

Since we've gathered all the required data, in our `<script>..</script>` tag we need to initialize the viewer. We do so by constructing an new `Mapillary.Viewer` and setting required parameters.

```js
var mly = new Mapillary
  .Viewer('mly', // container id
          'cjJ1SUtVOEMtdy11b21JM0tyYTZIQTo2ZmVjNTQ3YWQ0OWI2Yjgx', // your Client ID
          'ytfE1_iD_N-jmHfTHkj1Ug'  // photoId at which the viewer initializes
          )
```

## Changelog

Every release is described on the GitHub [Releases](https://github.com/mapillary/mapillary-js/releases) page.

## License

MIT License

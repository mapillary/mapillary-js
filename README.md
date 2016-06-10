[![Build Status](https://circleci.com/gh/mapillary/mapillary-js.svg?style=svg)](https://circleci.com/gh/mapillary/mapillary-js)

# MapillaryJS

MapillaryJS is a JavaScript & WebGL library that renders street level photos from [Mapillary](https://www.mapillary.com).

[<img width="438" style="margin-right: 4px;" alt="San Francisco on Mapillary.com" src="https://cloud.githubusercontent.com/assets/2492302/15964788/9d75b25e-2f1a-11e6-9c5f-b4a42853a1eb.png">](https://www.mapillary.com/map/im/VKf9Ay98ubkclhS2cCEWDg/photo) [<img width="438" alt="Frigilana on Mapillary.com" src="https://cloud.githubusercontent.com/assets/2492302/15964789/9d8256c6-2f1a-11e6-9d4b-bd906875078c.png">](https://www.mapillary.com/map/im/FjsftlSr2Vqigl8P2zpOAw/photo)

## Using MapillaryJS

To use MapillaryJS you must [create an account](http://www.mapillary.com/map/signup) and then [obtain a Client ID](http://www.mapillary.com/map/settings/integrations). Then you can use MapillaryJS with a `<script>` tag.

```html
<!DOCTYPE html>
<html>
<head>
    <script src='https://npmcdn.com/mapillary-js@1.4.1/dist/mapillary-js.min.js'></script>
    <link href='https://npmcdn.com/mapillary-js@1.4.1/dist/mapillary-js.min.css' rel='stylesheet' />
</head>

<body>
    <div id='mly' style='width: 640px; height: 480px;' />

    <script>
        var mly = new Mapillary.Viewer(
            'mly',
            '<your client id>',
            '<your photo id for initializing the viewer>'
       );
    </script>
</body>
</html>
```

Alternatively, you can `npm install mapillary-js` to use it with module loader or bundler of your choice.

Refer to the [Examples](https://github.com/mapillary/mapillary-js#examples) and [Documentation](https://mapillary.github.io/mapillary-js) sections below for more information.

## Examples

- [Simple MapillaryJS embedding](https://bl.ocks.org/knikel/4615432968a33f1fcd6b)
- [Storytelling with MapillaryJS](http://bl.ocks.org/knikel/630c2d6fa37a8a0e082a)
- [Slider displaying difference in two photos](http://bl.ocks.org/knikel/bc0f813f611a8787ff02)
- MapillaryJS + Leaflet - [Panorama](http://bl.ocks.org/knikel/f04c4656d1adeaaf1555) - [Perspective photo](http://bl.ocks.org/knikel/151a77df042cd3890502)
- MapillaryJS + Leaflet + Tangram - [Panorama](http://bl.ocks.org/knikel/0f297c5b1fcfd14e38ba) - [Perspective photo](http://bl.ocks.org/knikel/fbeda1c8f89c97612b10)
- MapillaryJS + Mapbox GL JS - [Panorama](http://bl.ocks.org/knikel/4ec4de69a0fc29318675) - [Perspective photo](http://bl.ocks.org/knikel/010115b08ebe30baba86)
- MapillaryJS + Esri Leaflet -  [Panorama](http://bl.ocks.org/knikel/dd38c3fb1bd8fb3a826c) - [Perspective photo](http://bl.ocks.org/knikel/e85b802e97fd3390668f)
- MapillaryJS + Google Maps - [Panorama](http://bl.ocks.org/knikel/451e2ee5d76ae72e669f)

## Documentation

- [API Reference](https://mapillary.github.io/mapillary-js)

## Changelog

Every release is described on the GitHub [Releases](https://github.com/mapillary/mapillary-js/releases) page.

## License

MIT License

## Contributing to MapillaryJS

See [CONTRIBUTING.md](https://github.com/mapillary/mapillary-js/blob/master/CONTRIBUTING.md).

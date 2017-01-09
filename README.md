[![Build Status](https://circleci.com/gh/mapillary/mapillary-js.svg?style=svg)](https://circleci.com/gh/mapillary/mapillary-js)

# MapillaryJS

MapillaryJS is a JavaScript & WebGL library that renders street level photos from [Mapillary](https://www.mapillary.com).

[<img width="49%" alt="San Francisco on Mapillary.com" src="https://cloud.githubusercontent.com/assets/2492302/15964788/9d75b25e-2f1a-11e6-9c5f-b4a42853a1eb.png">](https://www.mapillary.com/app/?focus=photo&pKey=VKf9Ay98ubkclhS2cCEWDg) [<img width="49%" alt="Frigilana on Mapillary.com" src="https://cloud.githubusercontent.com/assets/2492302/15964789/9d8256c6-2f1a-11e6-9d4b-bd906875078c.png">](https://www.mapillary.com/app/?focus=photo&pKey=FjsftlSr2Vqigl8P2zpOAw)

## Using MapillaryJS

To use MapillaryJS you must [create an account](https://www.mapillary.com/signup) and [obtain a Client ID](https://www.mapillary.com/app/settings/developers). Then you can use MapillaryJS with a `<script>` tag.

```html
<!DOCTYPE html>
<html>
<head>
    <script src='https://unpkg.com/mapillary-js@2.2.0/dist/mapillary.min.js'></script>
    <link href='https://unpkg.com/mapillary-js@2.2.0/dist/mapillary.min.css' rel='stylesheet' />
</head>

<body>
    <div id='mly' style='width: 640px; height: 480px;'></div>

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

Alternatively, you can `npm install mapillary-js` to use it with a module loader or bundler of your choice.

Refer to the [Examples](https://github.com/mapillary/mapillary-js#examples) and [Documentation](https://mapillary.github.io/mapillary-js) sections below for more information.

## Examples

- [Fixed size](https://bl.ocks.org/oscarlorentzon/63644e3b2392f2f2b7d000af9c506da6)
- [Dynamic size](https://bl.ocks.org/oscarlorentzon/5af00c5c07448233bcb62f5e2124ab39)
- [Load immediately](https://bl.ocks.org/oscarlorentzon/530cf3b89b8f5d1ecfdf4b79946caade)
- [No cover](https://bl.ocks.org/oscarlorentzon/4f6f7ae5e86db7446f78ccea1eb6c2a7)
- [Move to key](https://bl.ocks.org/oscarlorentzon/317da436accbcf2ff04c642f86cefaf8)
- [Move in direction](https://bl.ocks.org/oscarlorentzon/63ac2aa3f0998f0c2d2b01a42c8babe4)
- [Move close to latitude and longitude](https://bl.ocks.org/oscarlorentzon/a60f3dad3f3accfe67ea1048be88df26)
- [Viewer options](https://bl.ocks.org/oscarlorentzon/08613728a283d1306b2848533852d22a)
- [Subscribe to node changed](https://bl.ocks.org/oscarlorentzon/c5380e11fb3e84b8096f16737eb44820)
- [Set filter](https://bl.ocks.org/oscarlorentzon/400b034ce75430b1a1c69af835be566c)
- [Get center and zoom](https://bl.ocks.org/oscarlorentzon/752ffc27a31299f4ec9eb5b4e09b2d82)
- [Set center and zoom](https://bl.ocks.org/oscarlorentzon/54ef2277ce60e62f51891af699fad871)
- [Get bearing](https://bl.ocks.org/oscarlorentzon/ca9cee671156c685aca3e1f0f52a230e)
- [Slider](https://bl.ocks.org/oscarlorentzon/3e46cd939bbe3b6c93fa1e93a108f6a3)
- [Storytelling with route component](https://bl.ocks.org/oscarlorentzon/2a4041c93fb3711dc8dc53d1a217defe)
- [MapillaryJS + ESRI JS API](https://bl.ocks.org/oscarlorentzon/a9bd5d6dadcc5df7e024a04a9600b043)
- [MapillaryJS + Google Maps](https://bl.ocks.org/oscarlorentzon/fda7ce2bdae8499580b1f72d139103de)
- [MapillaryJS + Leaflet](https://bl.ocks.org/oscarlorentzon/0a11029a5627028c445a38016c76fb3a)
- [MapillaryJS + Leaflet ESRI](https://bl.ocks.org/oscarlorentzon/5a0b23ea8259db871bed2a724ee3afec)
- [MapillaryJS + Leaflet Tangram](https://bl.ocks.org/oscarlorentzon/6f0d316fee85320c552a4ed6838566a2)
- [MapillaryJS + Mapbox GL JS](https://bl.ocks.org/oscarlorentzon/0b7c5763225029268fce0324af2b2b3a)

## Documentation

- [API Reference](https://mapillary.github.io/mapillary-js)

## Changelog

Every release is described on the GitHub [Releases](https://github.com/mapillary/mapillary-js/releases) page.

## License

MIT License

## Contributing to MapillaryJS

See [CONTRIBUTING.md](https://github.com/mapillary/mapillary-js/blob/master/CONTRIBUTING.md).

## Migrating from MapillaryJS 1 to 2

See [MIGRATING.md](https://github.com/mapillary/mapillary-js/blob/master/MIGRATING.md).

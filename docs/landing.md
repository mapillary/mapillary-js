MapillaryJS is a JavaScript & WebGL library that renders street level imagery from [Mapillary](https://www.mapillary.com).

[<img width="49%" alt="San Francisco on Mapillary.com" src="https://user-images.githubusercontent.com/2492302/40781267-834ef7d4-64db-11e8-8c4c-3e83f17ff7c8.png">](https://www.mapillary.com/app/?focus=photo&pKey=VKf9Ay98ubkclhS2cCEWDg) [<img width="49%" alt="Frigilana on Mapillary.com" src="https://user-images.githubusercontent.com/2492302/40781605-ccfbb5c4-64dc-11e8-9b89-02beb73449ec.png">](https://www.mapillary.com/app/?focus=photo&pKey=FjsftlSr2Vqigl8P2zpOAw)

## Using MapillaryJS

To use MapillaryJS you must [create an account](https://www.mapillary.com/signup) and [obtain a Client ID by registering an application](https://www.mapillary.com/app/settings/developers).

You can use MapillaryJS as a `<script>` tag from a [CDN](https://unpkg.com/browse/mapillary-js@3.1.0/dist/), or as a `mapillary-js` package on [npm](https://www.npmjs.com/package/mapillary-js).

```html
<!DOCTYPE html>
<html>
<head>
    <script src='https://unpkg.com/mapillary-js@3.1.0/dist/mapillary.min.js'></script>
    <link href='https://unpkg.com/mapillary-js@3.1.0/dist/mapillary.min.css' rel='stylesheet' />
</head>

<body>
    <div id='mly' style='width: 640px; height: 480px;'></div>

    <script>
        var mly = new Mapillary.Viewer({
            apiClient: '<your client id>',
            container: 'mly',
            imageKey: '<your image key for initializing the viewer>',
        });
    </script>
</body>
</html>
```

## Documentation

Refer to the [Examples](#examples) section below and the [Index](./globals.html).

## Examples

### Support
- [Check if MapillaryJS is supported](https://bl.ocks.org/oscarlorentzon/c737167e64d52668bb4991167501bb84)

### Viewer
- [Fixed size](https://bl.ocks.org/oscarlorentzon/63644e3b2392f2f2b7d000af9c506da6)
- [Dynamic size](https://bl.ocks.org/oscarlorentzon/5af00c5c07448233bcb62f5e2124ab39)
- [Load immediately](https://bl.ocks.org/oscarlorentzon/530cf3b89b8f5d1ecfdf4b79946caade)
- [No cover](https://bl.ocks.org/oscarlorentzon/4f6f7ae5e86db7446f78ccea1eb6c2a7)
- [Initialize with or without a key](https://bl.ocks.org/oscarlorentzon/3eb61ce99b3c1cedba88942cb02f317d)
- [Determine if viewer is navigable](https://bl.ocks.org/oscarlorentzon/898c55ef06917b07f165b7707d9f3a9e)
- [Move to key](https://bl.ocks.org/oscarlorentzon/317da436accbcf2ff04c642f86cefaf8)
- [Move in direction](https://bl.ocks.org/oscarlorentzon/63ac2aa3f0998f0c2d2b01a42c8babe4)
- [Viewer options](https://bl.ocks.org/oscarlorentzon/08613728a283d1306b2848533852d22a)
- [Subscribe to node changed](https://bl.ocks.org/oscarlorentzon/c5380e11fb3e84b8096f16737eb44820)
- [Edges changed events](https://bl.ocks.org/oscarlorentzon/74f7da7d957c9bb7b3088dcc7350d82f)
- [Set filter](https://bl.ocks.org/oscarlorentzon/400b034ce75430b1a1c69af835be566c)
- [Change filters](https://bl.ocks.org/oscarlorentzon/10dad7582268312b1adac2c3a869c5c5)
- [Get center and zoom](https://bl.ocks.org/oscarlorentzon/752ffc27a31299f4ec9eb5b4e09b2d82)
- [Set center and zoom](https://bl.ocks.org/oscarlorentzon/54ef2277ce60e62f51891af699fad871)
- [LatLon, computedLatLon and originalLatLon explained](https://bl.ocks.org/oscarlorentzon/16946cb9eedfad2a64669cb1121e6c75)
- [Get bearing](https://bl.ocks.org/oscarlorentzon/ca9cee671156c685aca3e1f0f52a230e)
- [Side by side compare](https://bl.ocks.org/oscarlorentzon/1f2992f9f510d908a0a2c7212f0359cf)

### Viewer and map
- [MapillaryJS + ESRI JS API](https://bl.ocks.org/oscarlorentzon/a9bd5d6dadcc5df7e024a04a9600b043)
- [MapillaryJS + Google Maps](https://bl.ocks.org/oscarlorentzon/fda7ce2bdae8499580b1f72d139103de)
- [MapillaryJS + HERE Maps](https://bl.ocks.org/oscarlorentzon/520548974a5b184059553b75d3af8eb3)
- [MapillaryJS + Leaflet](https://bl.ocks.org/oscarlorentzon/0a11029a5627028c445a38016c76fb3a)
- [MapillaryJS + Leaflet ESRI](https://bl.ocks.org/oscarlorentzon/5a0b23ea8259db871bed2a724ee3afec)
- [MapillaryJS + Leaflet Tangram](https://bl.ocks.org/oscarlorentzon/6f0d316fee85320c552a4ed6838566a2)
- [MapillaryJS + Mapbox GL JS](https://bl.ocks.org/oscarlorentzon/0b7c5763225029268fce0324af2b2b3a)
- [MapillaryJS + OpenLayers](https://bl.ocks.org/oscarlorentzon/1a21ea14f9249517356d6d52afe092b5)

### Components

#### Marker
- [Configure marker style and behavior](https://bl.ocks.org/oscarlorentzon/e0806c8eebe0c67e681c20be95d546b9)
- [Add and drag markers](https://bl.ocks.org/oscarlorentzon/b05a698c4a84c06c4af59ee1a2897a9f)
- [Indicate hovered marker](https://bl.ocks.org/oscarlorentzon/d41678dd51e77ae909c0937ea6f6818d)
- [Sync viewer and map markers](https://bl.ocks.org/oscarlorentzon/0ec42b32dd175ca4cc7518006b888d3a)
- [Add one million interactive markers](https://bl.ocks.org/oscarlorentzon/999db12bc87c92d5c547b1e582989fc1)

#### Mouse
- [Enable and disable mouse and touch handlers](https://bl.ocks.org/oscarlorentzon/37d28603212de2b8326bb65e49418368)

#### Keyboard
- [Enable and disable keyboard handlers](https://bl.ocks.org/oscarlorentzon/c92bbefbd4c74d4a490a8b37c85a1a7b)

#### Popup
- [Display a popup](https://bl.ocks.org/oscarlorentzon/54182e3f3624cdeb7ca960d96ebfa5fb)
- [Display a configured popup](https://bl.ocks.org/oscarlorentzon/9e31ccdcf39b4b5fe1b739871c4d7b86)
- [Relate popups to tags](https://bl.ocks.org/oscarlorentzon/84fc2d87f4aab1b8a434c96161e13509)

#### Route
- [Storytelling](https://bl.ocks.org/oscarlorentzon/2a4041c93fb3711dc8dc53d1a217defe)

#### Slider
- [Compare images](https://bl.ocks.org/oscarlorentzon/3e46cd939bbe3b6c93fa1e93a108f6a3)

#### Tag
- [Show point, polygon and rect tags](https://bl.ocks.org/oscarlorentzon/04f46dcc3c1c08b8887ed681db0127c4)
- [Configure point, polygon and rect tags](https://bl.ocks.org/oscarlorentzon/a9ad92a720d2f175c9ce7f3f982ac59f)
- [Create tags](https://bl.ocks.org/oscarlorentzon/94539cefc33296ab6f28e3a83ecdccf1)
- [Listen to geometry changes](https://bl.ocks.org/oscarlorentzon/d19b3387b7671be59f4add09f67c3b63)
- [Indicate hovered tag](https://bl.ocks.org/oscarlorentzon/d99e59952f64a3692c0ae660b4252c60)

## Migrating

Learn how to [migrate](https://github.com/mapillary/mapillary-js/blob/master/MIGRATING.md) between major MapillaryJS releases.

## Contribute to MapillaryJS

Learn how to [contribute](https://github.com/mapillary/mapillary-js/blob/master/.github/CONTRIBUTING.md).

### [Code of Conduct](https://code.facebook.com/codeofconduct)

Facebook has adopted a Code of Conduct that we expect project participants to adhere to. Please read [the full text](https://github.com/mapillary/mapillary-js/blob/master/.github/CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

## License

MapillaryJS is [MIT licensed](https://github.com/mapillary/mapillary-js/blob/master/LICENSE).

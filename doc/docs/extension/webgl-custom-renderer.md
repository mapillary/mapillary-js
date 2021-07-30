---
id: webgl-custom-renderer
title: WebGL Renderer
---

MapillaryJS comes with a core set of visualization features. If you want augment the MapillaryJS experience you can extend it by rendering your own 3D objects. There are mulitple ways to do this, in this guide we will use the WebGL API.

:::info You will learn

- How to use WebGL to render 3D objects directly into the MapillaryJS rendering context
- How to implement the `ICustomRenderer` interface using the WebGL API
- How to add your renderer to the `Viewer`

:::

## Creating a 3D Object

We will base our renderer on the [Creating 3D object usings WebGL tutorial](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL) on MDN and add a cube to the street 3D space in MapillaryJS.

The buffer and shader program setup in our code is very similar to the one in the MDN tutorial. First, we create a function to build the cube's vertex position buffer (and similarly the color and index buffers).

```js
function initBuffers(gl) {
  const positions = [
    // Front
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
    // ...
  ];

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // ...
}
```

Then, like in the MDN tutorial, we create a function to compile our shaders and initialize our shader program.

```js
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // ...

  return {fragmentShader, shaderProgram, vertexShader};
}
```

### Geo Coordinates

From here on, our code will differ slightly from the MDN tutorial. We will go through why it differs.

First, entities rendered in MapillaryJS have geodetic coordiantes (or have a position relative to a geodetic reference coordinate) so we set its geo position. Also, instead of the combined `modelViewMatrix` used in the MDN example, we will separate it into two matrices, the `modelMatrix` and the `viewMatrix` for clarity. The model matrix defines the transform of the model, in this case our cube. We initialize it to identity but will soon change that.

```js
const cube = {
  geoPosition: {
    alt: 1,
    lat: -25.28268614514251,
    lng: -57.630922858385,
  },
  modelMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
};
```

Our vertex shader is adjusted to use the `modelMatrix` when calculating the `gl_Position` accordingly.

```js
const vertexShaderSource = `
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;

  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying lowp vec4 vColor;

  void main(void) {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
    vColor = aVertexColor;
  }
`;
```

:::tip

If you want to learn more about model, view, and projection matrices, take a look at the [WebGL model view projection article](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection) on MDN. Our custom renderer will rely on all three of them.

:::

## Creating the Custom Renderer

With the initialization code completed, we can can start implementing our custom renderer. To create it, we will implement the [ICustomRenderer](/api/interfaces/viewer.icustomrenderer) interface.

Let us go through it member by member.

### `constructor`

We can use the constructor to assign readonly properties of our renderer. Every custom renderer needs to have a unique ID and specify its render pass (currently the only supported render pass is `Opaque`). These properties will not change so the constructor is a good place to assign them. Our cube will also be readonly so we assign it here as well.

```js
class WebGLCubeRenderer {
  constructor(cube) {
    this.id = 'webgl-cube-renderer';
    this.renderPass = RenderPass.Opaque;
    this.cube = cube;
  }
  // ...
}
```

### `onAdd`

ICustomRenderer.[onAdd](/api/interfaces/viewer.icustomrenderer#onadd) is called when the renderer has been added to the `Viewer` with the Viewer.[addCustomRenderer](/api/classes/viewer.Viewer#addcustomrenderer) method. This gives your renderer a chance to initialize WebGL resources and register event listeners. It is also a chance to calculate the [local topocentric positions](/docs/theory/coordinates#local-topocentric-coordinates) for scene objects using the provided reference.

To calculate the topocentric position of our cube, we will make use of the [geodeticToEnu](/api/modules/api#geodetictoenu) helper function in MapillaryJS and make a translation matrix by translating the cube according to the east, north, up coordinates.

```js
function makeTranslation(v) {
  const [x, y, z] = v;
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}

function makeModelMatrix(geoPosition, reference) {
  const enuPosition = geodeticToEnu(
    geoPosition.lng,
    geoPosition.lat,
    geoPosition.alt,
    reference.lng,
    reference.lat,
    reference.alt,
  );
  const modelMatrix = makeTranslation(enuPosition);
  return modelMatrix;
}
```

:::tip

If you need to perform vector and matrix operations, we recommend using the [glMatrix](https://glmatrix.net/) library or the [Three.js math modules](https://threejs.org/docs/index.html#api/en/math/Matrix4) (like in the [Three.js Custom Renderer](/examples/three-renderer) example).

:::

With our helper functions, we can calculate the tranformation matrix of our cube model using the `reference` parameter of the `onAdd` method. With the context parameter we can initialize our shader program and buffers. We make sure to add the `modelMatrix` and `viewMatrix` as uniforms to our program info.

```js
class WebGLCubeRenderer {
  // ...
  onAdd(viewer, reference, context) {
    this.cube.modelMatrix = makeModelMatrix(this.cube.geoPosition, reference);

    const gl = context;
    const {fragmentShader, shaderProgram, vertexShader} = initShaderProgram(
      gl,
      vertexShaderSource,
      fragmentShaderSource,
    );

    this.buffers = initBuffers(gl);
    this.fragmentShader = fragmentShader;
    this.vertexShader = vertexShader;
    this.shaderProgram = shaderProgram;
    this.programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
      },
      uniformLocations: {
        modelMatrix: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
        projectionMatrix: gl.getUniformLocation(
          shaderProgram,
          'uProjectionMatrix',
        ),
        viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
      },
    };
  }
}
```

### `onReference`

While we will only operate in a small area around the cube with our renderer, MapillaryJS operates on global earth scale. For different reasons, e.g. to ensure numeric stability by keeping topocentric coordinates sufficiently small, MapillaryJS will sometimes update its internal reference geo coordinate used to convert coordinates from geodetic to local topocentric reference. Whenever it updates the reference, it will notify our renderer by calling the ICustomRenderer.[onReference](/api/interfaces/viewer.icustomrenderer#onreference) method so that we can act accordingly and recalculate our translation and assign a new `modelMatrix` our cube. This does not mean the the cube moves relative to the street imagery. Instead, the earth sphere that MapillaryJS operates on has been rotated and we need to adjust everything we want to render accordingly.

```js
class WebGLCubeRenderer {
  //...
  onReference(viewer, reference) {
    this.cube.modelMatrix = makeModelMatrix(this.cube.geoPosition, reference);
  }
}
```

### `onRemove`

ICustomRenderer.[onRemove](/api/interfaces/viewer.icustomrenderer#onremove) is called when the renderer has been removed from the `Viewer` with the Viewer.[removeCustomRenderer](/api/classes/viewer.Viewer#addcustomrenderer) method. This gives us a chance to clean up our WebGL resources (and potential event listeners etc).

```js
class WebGLCubeRenderer {
  //...
  onRemove(viewer, context) {
    const {buffers, fragmentShader, shaderProgram, vertexShader} = this;

    const gl = context;
    gl.deleteProgram(shaderProgram);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);

    const {color, indices, position} = buffers;
    gl.deleteBuffer(color);
    gl.deleteBuffer(indices);
    gl.deleteBuffer(position);
  }
}
```

### `render`

ICustomRenderer.[render](/api/interfaces/viewer.icustomrenderer#render) is called during every animation frame that is run. It allows our renderer to draw into the WebGL context.

:::note

When the Viewer is halted, i.e. when no motion such as translation or rotation is performed, the animation frames are not run and therefore the `render` method will not be called. See the [Animation](/docs/extension/animation) example for guidance into how to force all animation frames to be run and the render method to be called on every frame.

:::

Binding our vertex, color, and index buffers to WebGL attributes works exactly like in the MDN tutorial but we have to change some things regarding setup and uniforms. While the MDN tutorial clears the WebGL context, we do not want to clear anything and instead add content superimposed onto the MapillaryJS street imagery scene. Also, while the MDN tutorial sets up the WebGL view-model and projection matrices in its draw call, MapillaryJS provides the `viewMatrix` and `projectionMatrix` as parameters. We will use them together with the cube `modelMatrix` to set up our uniforms.

```js
render(context, viewMatrix, projectionMatrix) {
    const gl = context;
    const {buffers, programInfo} = this;
    const {modelMatrix} = this.cube;

    // ...

    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelMatrix,
      false,
      modelMatrix,
    );
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix,
    );
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.viewMatrix,
      false,
      viewMatrix,
    );

    {
      const vertexCount = 36;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }
}
```

:::caution

Your custom renderer cannot make assumptions about the current WebGL state. If you run into rendering problems with you custom renderers, resetting the WebGL state may help.

:::

### Additional Functionality

In our custom renderer we only have a single fixed cube that is always visible. Maybe you want to add and remove objects dynamically, change object positions, or change object appearance during the lifespan of the renderer and application. To do that, you can add additional methods and functionality to your renderer class directly or in helpers.

:::note

As of this writing, MapillaryJS will always render the street imagery layer as a background. Occlusion between custom rendered objects and the street imagery will never occur, custom rendered objects will always be rendered on top of the street imagery. You can eperiment with transparency to assert object placement.

:::

## Adding the Renderer

Now that we have implemented our custom cube renderer, we just need to add it to the `Viewer` through the Viewer.[addCustomRenderer](/api/classes/viewer.Viewer#addcustomrenderer) method.

:::tip

Try changing the cube's geo position, for example the altitude, to see how it affects where it is placed in relation to the imagery.

:::

```jsx live
function render(props) {
  let viewer;

  function init(opts) {
    const {accessToken, container} = opts;

    const imageId = '3748064795322267';
    const options = {
      accessToken,
      component: {cover: false},
      container,
    };
    viewer = new Viewer(options);

    const cube = {
      geoPosition: {
        alt: 1,
        lat: -25.28268614514251,
        lng: -57.630922858385,
      },
      modelMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    };
    const cubeRenderer = new webglrenderer.WebGLCubeRenderer(cube);
    viewer.addCustomRenderer(cubeRenderer);

    viewer.moveTo(imageId).catch(mapillaryErrorHandler);
  }

  function dispose() {
    if (viewer) {
      viewer.remove();
    }
  }

  return (
    <ViewerComponent init={init} dispose={dispose} style={{height: '400px'}} />
  );
}
```

## Recap

- To add your 3D objects to MapillaryJS, implement the `ICustomRenderer` interface
- Make sure your objects have a geo position (or a position relative to a geo reference)
- Use the MapillaryJS geo reference parameter to translate your objects to local topocentric coordinates
- Add your custom renderer to the `Viewer` to render directly into the MapillaryJS rendering context

:::info

You can view the complete code in the [WebGL Renderer](/examples/webgl-renderer) example.

:::

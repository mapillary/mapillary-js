/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  geodeticToEnu,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';

function initBuffers(gl) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const positions = [
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, 1.0, -1.0,
    -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0,
    -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
    1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0,
    -1.0, 1.0, -1.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  const faceColors = [
    [1.0, 1.0, 1.0, 1.0],
    [1.0, 0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
  ];

  let colors = [];
  for (let j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];
    colors = colors.concat(c, c, c, c);
  }

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  const indices = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
    15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
  ];

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW,
  );

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
  };
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    const infoLog = gl.getShaderInfoLog(shader);
    throw new Error(`An error occurred compiling the shaders: ${infoLog}`);
  }

  return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    const infoLog = gl.getProgramInfoLog(shaderProgram);
    throw new Error(`Unable to initialize the shader program: ${infoLog}`);
  }

  return {fragmentShader, shaderProgram, vertexShader};
}

export function makeTranslation(v) {
  const [x, y, z] = v;
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}

function makeModelMatrix(geoPosition, reference) {
  const position = geodeticToEnu(
    geoPosition.lng,
    geoPosition.lat,
    geoPosition.alt,
    reference.lng,
    reference.lat,
    reference.alt,
  );
  const modelMatrix = makeTranslation(position);
  return modelMatrix;
}

class WebGLCubeRenderer {
  constructor() {
    this.id = 'webgl-cube-renderer';

    this.modelMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    this.cubeGeoPosition = {
      alt: 1,
      lat: -25.28268614514251,
      lng: -57.630922858385,
    };
  }

  onAdd(viewer, reference, context) {
    const {cubeGeoPosition} = this;
    this.modelMatrix = makeModelMatrix(cubeGeoPosition, reference);

    const vsSource = `
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

    const fsSource = `
      varying lowp vec4 vColor;

      void main(void) {
        gl_FragColor = vColor;
      }
    `;

    const gl = context;
    const {fragmentShader, shaderProgram, vertexShader} = initShaderProgram(
      gl,
      vsSource,
      fsSource,
    );

    this.fragmentShader = fragmentShader;
    this.vertexShader = vertexShader;
    this.shaderProgram = shaderProgram;
    this.buffers = initBuffers(gl);
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

  onReferenceChanged(viewer, reference) {
    const {cubeGeoPosition} = this;
    this.modelMatrix = makeModelMatrix(cubeGeoPosition, reference);
  }

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

  render(context, viewMatrix, projectionMatrix) {
    const gl = context;
    const {buffers, modelMatrix, programInfo} = this;

    {
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
      );
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

    {
      const numComponents = 4;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset,
      );
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
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

let viewer;

export function init(opts) {
  const {appToken, container} = opts;
  const options = {
    apiClient: appToken,
    component: {cover: false},
    container,
  };

  viewer = new Viewer(options);
  viewer.addCustomRenderer(new WebGLCubeRenderer());

  viewer
    .moveTo('H_g2NFQvEXdGGyTjY27FMA')
    .catch((error) => console.error(error));
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}

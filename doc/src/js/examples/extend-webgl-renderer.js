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
  RenderPass,
  Viewer,
} from '../../mapillary-js/dist/mapillary.module';

function initBuffers(gl) {
  const positions = [
    // Front
    ...[-1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0],
    // Back
    ...[-1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0],
    // Top
    ...[-1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0],
    // Bottom
    ...[-1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0],
    // Right
    ...[1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0],
    // Left
    ...[-1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0],
  ];

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const faceColors = [
    [1.0, 1.0, 1.0, 1.0], // Front
    [1.0, 0.0, 0.0, 1.0], // Back
    [0.0, 1.0, 0.0, 1.0], // Top
    [0.0, 0.0, 1.0, 1.0], // Bottom
    [1.0, 1.0, 0.0, 1.0], // Right
    [1.0, 0.0, 1.0, 1.0], // Left
  ];

  let colors = [];
  for (let j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];
    colors = colors.concat(c, c, c, c);
  }
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  const indices = [
    // Front
    0, 1, 2, 0, 2, 3,
    // Back
    4, 5, 6, 4, 6, 7,
    // Top
    8, 9, 10, 8, 10, 11,
    // Bottom
    12, 13, 14, 12, 14, 15,
    // Right
    16, 17, 18, 16, 18, 19,
    // Left
    20, 21, 22, 20, 22, 23,
  ];

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
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

const fragmentShaderSource = `
  varying lowp vec4 vColor;

  void main(void) {
    gl_FragColor = vColor;
  }
`;

export class WebGLCubeRenderer {
  constructor(cube) {
    this.id = 'webgl-cube-renderer';
    this.renderPass = RenderPass.Opaque;
    this.cube = cube;
  }

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

  onReference(viewer, reference) {
    this.cube.modelMatrix = makeModelMatrix(this.cube.geoPosition, reference);
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
    const {buffers, programInfo} = this;
    const {modelMatrix} = this.cube;

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
  const cubeRenderer = new WebGLCubeRenderer(cube);
  viewer.addCustomRenderer(cubeRenderer);

  viewer.moveTo(imageId).catch((error) => console.error(error));
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}

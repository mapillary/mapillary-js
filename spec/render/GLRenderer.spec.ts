/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {GLRenderer} from "../../src/Render";
import {IFrame} from "../../src/State";

describe("GLRenderer.ctor", () => {
    it("should be contructed", () => {
        let element: HTMLDivElement = document.createElement("div");

        let glRenderer: GLRenderer = new GLRenderer(element, rx.Observable.empty<IFrame>())

        expect(glRenderer).not.toBeNull();
    });

    it("should not instantiate a WebGL context", () => {
        spyOn(THREE, "WebGLRenderer");

        let element: HTMLDivElement = document.createElement("div");

        let glRenderer: GLRenderer = new GLRenderer(element, rx.Observable.empty<IFrame>())

        expect(THREE.WebGLRenderer).not.toHaveBeenCalled();
    });
});

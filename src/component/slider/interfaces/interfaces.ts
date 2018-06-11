import * as THREE from "three";

import {SliderGLRenderer} from "../../../Component";
import {Node} from "../../../Graph";
import {ICurrentState} from "../../../State";

export interface ISliderNodes {
    background: Node;
    foreground: Node;
}

export interface ISliderCombination {
    nodes: ISliderNodes;
    state: ICurrentState;
}

export interface IGLRendererOperation {
    (glRenderer: SliderGLRenderer): SliderGLRenderer;
}

export type PositionLookat = [THREE.Vector3, THREE.Vector3, number, number, number];

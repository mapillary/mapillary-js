import * as THREE from "three";

import { Node } from "../../../graph/Node";
import { ICurrentState } from "../../../state/interfaces/ICurrentState";
import { SliderGLRenderer } from "../SliderGLRenderer";

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

import * as THREE from "three";

import { Node } from "../../../graph/Node";
import { IAnimationState } from "../../../state/interfaces/IAnimationState";
import { SliderGLRenderer } from "../SliderGLRenderer";

export interface SliderNodes {
    background: Node;
    foreground: Node;
}

export interface SliderCombination {
    nodes: SliderNodes;
    state: IAnimationState;
}

export interface GLRendererOperation {
    (glRenderer: SliderGLRenderer): SliderGLRenderer;
}

export type PositionLookat = [THREE.Vector3, THREE.Vector3, number, number, number];

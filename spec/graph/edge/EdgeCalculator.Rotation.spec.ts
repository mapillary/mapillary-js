/// <reference path="../../../typings/index.d.ts" />

import {
    EdgeCalculator,
    EdgeCalculatorSettings,
    EdgeCalculatorDirections,
    EdgeDirection,
    IEdge,
    IPotentialEdge,
} from "../../../src/Edge";
import {ArgumentMapillaryError} from "../../../src/Error";
import {NewNode} from "../../../src/Graph";
import {Spatial} from "../../../src/Geo";
import {EdgeCalculatorHelper} from "../../helper/EdgeCalculatorHelper.spec";

describe("EdgeCalculator.computeRotationEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let spatial: Spatial;

    let node: NewNode;
    let potentialEdge: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        directions = new EdgeCalculatorDirections();

        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();

        spatial = new Spatial();
    });

    beforeEach(() => {
        node = helper.createDefaultNode();

        potentialEdge = helper.createPotentialEdge();
        potentialEdge.distance = settings.rotationMaxDistance / 2;
    });

    it("should throw when node is not full", () => {
        node = helper.createCoreNode("", { alt: 0, lat: 0, lon: 0 }, "");

        expect(() => { edgeCalculator.computeRotationEdges(node, []); }).toThrowError(ArgumentMapillaryError);
    });

    it("should have a rotate left edge", () => {
        potentialEdge.directionChange = settings.rotationMaxDirectionChange / 2;

        let rotationEdges: IEdge[] = edgeCalculator.computeRotationEdges(node, [potentialEdge]);

        expect(rotationEdges.length).toBe(1);

        let rotationEdge: IEdge = rotationEdges[0];

        expect(rotationEdge.to).toBe(potentialEdge.key);
        expect(rotationEdge.data.direction).toBe(EdgeDirection.RotateLeft);
    });

    it("should have a rotate right edge", () => {
        potentialEdge.directionChange = -settings.rotationMaxDirectionChange / 2;

        let rotationEdges: IEdge[] = edgeCalculator.computeRotationEdges(node, [potentialEdge]);

        expect(rotationEdges.length).toBe(1);

        let rotationEdge: IEdge = rotationEdges[0];

        expect(rotationEdge.to).toBe(potentialEdge.key);
        expect(rotationEdge.data.direction).toBe(EdgeDirection.RotateRight);
    });
});

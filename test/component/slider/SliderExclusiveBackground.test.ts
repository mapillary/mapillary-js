import * as THREE from "three";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";

describe("SliderGLRenderer background ownership", () => {
    it("clears earlier background renders before drawing the comparison", () => {
        const calls: string[] = [];
        const renderer = <THREE.WebGLRenderer><unknown>{
            clear: () => calls.push("clear"),
            render: () => calls.push("render"),
        };
        new SliderGLRenderer().render(new THREE.PerspectiveCamera(), renderer);
        expect(calls[0]).toBe("clear");
        expect(calls.slice(1).every(call => call === "render")).toBe(true);
    });
});

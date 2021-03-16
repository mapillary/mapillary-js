import { SequenceEnt } from "../../src/api/ents/SequenceEnt";
import { Sequence } from "../../src/graph/Sequence";

describe("Sequence", () => {
    let sequence: Sequence;

    beforeEach(() => {
        let response: SequenceEnt = {
            key: "A",
            keys: ["B", "C", "D", "E"],
        };

        sequence = new Sequence(response);
    });

    it("should create a sequence", () => {
        expect(sequence).toBeDefined();
    });

    it("should find next key when it exists", () => {
        expect(sequence.findNextKey("C")).toEqual("D");
    });

    it("should find prev key when it exists", () => {
        expect(sequence.findPrevKey("C")).toEqual("B");
    });

    it("should return null if no next key", () => {
        expect(sequence.findNextKey("E")).toBe(null);
    });

    it("should return null if no prev key", () => {
        expect(sequence.findPrevKey("B")).toBe(null);
    });
});

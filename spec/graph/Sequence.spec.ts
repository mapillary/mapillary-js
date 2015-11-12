/// <reference path="../../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;

describe("Sequence", () => {
    var response: any;

    beforeEach(() => {
        response = {
            key: 'A',
            keys: ['B','C','D','E'],
            path: {}
        }
    });

    it("should create a sequence", () => {
        let sequence: any = new Mapillary.Sequence(response);
        expect(sequence).toBeDefined();
    });

    it("should find next key when it exists", () => {
        let sequence: any = new Mapillary.Sequence(response);
        expect(sequence.findNextKey('C')).toEqual('D')
    });

    it("should find prev key when it exists", () => {
        let sequence: any = new Mapillary.Sequence(response);
        expect(sequence.findPrevKey('C')).toEqual('B')
    });

    it("should return null if no next key", () => {
        let sequence: any = new Mapillary.Sequence(response);
        expect(sequence.findNextKey('E')).toBe(null)
    });

    it("should return null if no prev key", () => {
        let sequence: any = new Mapillary.Sequence(response);
        expect(sequence.findPrevKey('B')).toBe(null)
    });
});
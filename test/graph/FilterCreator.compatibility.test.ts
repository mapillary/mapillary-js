import { Image } from "../../src/graph/Image";
import { FilterExpression } from "../../src/graph/FilterExpression";
import { FilterCreator, FilterFunction } from "../../src/graph/FilterCreator";

describe("FilterCreator security-policy compatibility", () => {
    it("should create and evaluate every operator without dynamic code generation", () => {
        const creator: FilterCreator = new FilterCreator();
        const image: Image = <Image><unknown>{ capturedAt: 1, sequenceId: "sequence" };
        const expressions: FilterExpression[] = [
            ["==", "capturedAt", 1],
            ["!=", "capturedAt", 0],
            [">", "capturedAt", 0],
            [">=", "capturedAt", 1],
            ["<", "capturedAt", 2],
            ["<=", "capturedAt", 1],
            ["in", "sequenceId", "other", "sequence"],
            ["!in", "sequenceId", "other"],
            ["all", [">", "capturedAt", 0], ["==", "sequenceId", "sequence"]],
        ];
        const results: boolean[] = [];
        const functionSpy: jest.SpyInstance = jest.spyOn(global, "Function").mockImplementation(() => {
            throw new EvalError("Dynamic code generation is disabled");
        });
        const evalSpy: jest.SpyInstance = jest.spyOn(global, "eval").mockImplementation(() => {
            throw new EvalError("Dynamic code generation is disabled");
        });

        try {
            for (const expression of expressions) {
                const filter: FilterFunction = creator.createFilter(expression);
                results.push(filter(image));
            }
            results.push(creator.createFilter(null)(image));
            results.push(creator.createFilter(undefined)(image));
            results.push(creator.createFilter(["all"])(image));
        } finally {
            evalSpy.mockRestore();
            functionSpy.mockRestore();
        }

        expect(results).toEqual(expressions.map(() => true).concat([true, true, true]));
    });

    it("should short-circuit all when an earlier expression is false", () => {
        const creator: FilterCreator = new FilterCreator();
        const image: Image = <Image><unknown>{
            capturedAt: 0,
            get sequenceId(): string {
                throw new Error("The later expression must not be evaluated");
            },
        };
        const filter: FilterFunction = creator.createFilter([
            "all", [">", "capturedAt", 0], ["==", "sequenceId", "sequence"],
        ]);

        expect(filter(image)).toBe(false);
    });

    it("should preserve string escaping and strict type comparisons", () => {
        const creator: FilterCreator = new FilterCreator();
        const value: string = "quoted\"\\\nvalue";
        const image: Image = <Image><unknown>{ sequenceId: value, capturedAt: 1 };

        expect(creator.createFilter(["==", "sequenceId", value])(image)).toBe(true);
        expect(creator.createFilter(["in", "sequenceId", "other", value])(image)).toBe(true);
        expect(creator.createFilter(["==", "capturedAt", "1"])(image)).toBe(false);
        expect(creator.createFilter([">=", "capturedAt", "1"])(image)).toBe(false);
    });
});

describe("FilterCreator non-finite numeric compatibility", () => {
    for (const value of [NaN, Infinity, -Infinity]) {
        it(`should preserve null comparisons for ${value}`, () => {
            const creator: FilterCreator = new FilterCreator();
            const nullImage: Image = <Image><unknown>{ capturedAt: null };
            const numericImage: Image = <Image><unknown>{ capturedAt: 1 };
            const nonFiniteImage: Image = <Image><unknown>{ capturedAt: value };

            expect(creator.createFilter(["==", "capturedAt", value])(nullImage)).toBe(true);
            expect(creator.createFilter(["!=", "capturedAt", value])(nullImage)).toBe(false);
            expect(creator.createFilter([">=", "capturedAt", value])(nullImage)).toBe(true);
            expect(creator.createFilter(["<=", "capturedAt", value])(nullImage)).toBe(true);
            expect(creator.createFilter([">", "capturedAt", value])(numericImage)).toBe(false);
            expect(creator.createFilter(["<", "capturedAt", value])(numericImage)).toBe(false);
            expect(creator.createFilter(["==", "capturedAt", value])(nonFiniteImage)).toBe(false);
        });

        it(`should preserve null membership for ${value}`, () => {
            const creator: FilterCreator = new FilterCreator();
            const nullImage: Image = <Image><unknown>{ capturedAt: null };
            const numericImage: Image = <Image><unknown>{ capturedAt: 1 };
            const nonFiniteImage: Image = <Image><unknown>{ capturedAt: value };

            expect(creator.createFilter(["in", "capturedAt", value])(nullImage)).toBe(true);
            expect(creator.createFilter(["!in", "capturedAt", value])(nullImage)).toBe(false);
            expect(creator.createFilter(["in", "capturedAt", value])(numericImage)).toBe(false);
            expect(creator.createFilter(["in", "capturedAt", value])(nonFiniteImage)).toBe(false);
            expect(creator.createFilter(["in", "capturedAt", value, 1])(numericImage)).toBe(true);
        });
    }
});

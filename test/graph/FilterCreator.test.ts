import { ImageHelper } from "../helper/ImageHelper";
import { Image } from "../../src/graph/Image";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { FilterCreator, FilterFunction } from "../../src/graph/FilterCreator";
import { SetMembershipFilterExpression } from "../../src/graph/FilterExpression";

/**
 * Implementation based on https://github.com/mapbox/feature-filter.
 */
describe("FilterCreator.ctor", () => {
    it("should create a filter", () => {
        let filter: FilterCreator = new FilterCreator();

        expect(filter).toBeDefined();
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should compare ==, string", () => {
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "skey";
        let filter: FilterFunction = creator.createFilter(["==", "sequenceId", sequenceKey]);

        let coreImage1: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage2: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage3: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage4: CoreImageEnt = helper.createCoreImageEnt();

        coreImage1.sequence.id = sequenceKey;
        coreImage2.sequence.id = sequenceKey + "w";
        coreImage3.sequence.id = null;
        coreImage4.sequence.id = undefined;

        let image1: Image = new Image(coreImage1);
        let image2: Image = new Image(coreImage2);
        let image3: Image = new Image(coreImage3);
        let image4: Image = new Image(coreImage4);

        expect(filter(image1)).toBe(true);
        expect(filter(image2)).toBe(false);
        expect(filter(image3)).toBe(false);
        expect(filter(image4)).toBe(false);
    });

    it("should compare ==, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter(["==", "capturedAt", capturedAt]);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());
        let image4: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage4: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.captured_at = capturedAt;
        fillImage2.captured_at = capturedAt + 1;
        fillImage3.captured_at = null;
        fillImage4.captured_at = undefined;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);
        image4.makeComplete(fillImage4);

        expect(filter(image1)).toBe(true);
        expect(filter(image2)).toBe(false);
        expect(filter(image3)).toBe(false);
        expect(filter(image4)).toBe(false);
    });

    it("should compare ==, null", () => {
        let creator: FilterCreator = new FilterCreator();

        let filter = creator.createFilter(["==", "creatorId", null]);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());
        let image4: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage4: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.creator.id = null;
        fillImage2.creator.id = "ukey";
        fillImage3.creator.id = "null";
        fillImage4.creator.id = undefined;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);
        image4.makeComplete(fillImage4);

        expect(filter(image1)).toBe(true);
        expect(filter(image2)).toBe(false);
        expect(filter(image3)).toBe(false);
        expect(filter(image4)).toBe(false);
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should compare !=, string", () => {
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "skey";
        let filter: FilterFunction = creator.createFilter(["!=", "sequenceId", sequenceKey]);

        let coreImage1: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage2: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage3: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage4: CoreImageEnt = helper.createCoreImageEnt();

        coreImage1.sequence.id = sequenceKey;
        coreImage2.sequence.id = sequenceKey + "w";
        coreImage3.sequence.id = null;
        coreImage4.sequence.id = undefined;

        let image1: Image = new Image(coreImage1);
        let image2: Image = new Image(coreImage2);
        let image3: Image = new Image(coreImage3);
        let image4: Image = new Image(coreImage4);

        expect(filter(image1)).toBe(false);
        expect(filter(image2)).toBe(true);
        expect(filter(image3)).toBe(true);
        expect(filter(image4)).toBe(true);
    });

    it("should compare !=, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter(["!=", "capturedAt", capturedAt]);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());
        let image4: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage4: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.captured_at = capturedAt;
        fillImage2.captured_at = capturedAt + 1;
        fillImage3.captured_at = null;
        fillImage4.captured_at = undefined;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);
        image4.makeComplete(fillImage4);

        expect(filter(image1)).toBe(false);
        expect(filter(image2)).toBe(true);
        expect(filter(image3)).toBe(true);
        expect(filter(image4)).toBe(true);
    });

    it("should compare !=, null", () => {
        let creator: FilterCreator = new FilterCreator();

        let filter = creator.createFilter(["!=", "creatorId", null]);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());
        let image4: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage4: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.creator.id = null;
        fillImage2.creator.id = "ukey";
        fillImage3.creator.id = "null";
        fillImage4.creator.id = undefined;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);
        image4.makeComplete(fillImage4);

        expect(filter(image1)).toBe(false);
        expect(filter(image2)).toBe(true);
        expect(filter(image3)).toBe(true);
        expect(filter(image4)).toBe(true);
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should compare >, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter([">", "capturedAt", capturedAt]);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());
        let image4: Image = new Image(helper.createCoreImageEnt());
        let image5: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage4: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage5: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.captured_at = capturedAt - 1;
        fillImage2.captured_at = capturedAt;
        fillImage3.captured_at = capturedAt + 1;
        fillImage4.captured_at = null;
        fillImage5.captured_at = undefined;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);
        image4.makeComplete(fillImage4);
        image5.makeComplete(fillImage5);

        expect(filter(image1)).toBe(false);
        expect(filter(image2)).toBe(false);
        expect(filter(image3)).toBe(true);
        expect(filter(image4)).toBe(false);
        expect(filter(image5)).toBe(false);
    });

    it("should compare >, string", () => {
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createFilter([">", "sequenceId", sequenceKey]);

        let coreImage1: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage2: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage3: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage4: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage5: CoreImageEnt = helper.createCoreImageEnt();

        coreImage1.sequence.id = "-1";
        coreImage2.sequence.id = sequenceKey;
        coreImage3.sequence.id = "1";
        coreImage4.sequence.id = null;
        coreImage5.sequence.id = undefined;

        let image1: Image = new Image(coreImage1);
        let image2: Image = new Image(coreImage2);
        let image3: Image = new Image(coreImage3);
        let image4: Image = new Image(coreImage4);
        let image5: Image = new Image(coreImage4);

        expect(filter(image1)).toBe(false);
        expect(filter(image2)).toBe(false);
        expect(filter(image3)).toBe(true);
        expect(filter(image4)).toBe(false);
        expect(filter(image5)).toBe(false);
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should compare >=, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter([">=", "capturedAt", capturedAt]);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());
        let image4: Image = new Image(helper.createCoreImageEnt());
        let image5: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage4: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage5: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.captured_at = capturedAt - 1;
        fillImage2.captured_at = capturedAt;
        fillImage3.captured_at = capturedAt + 1;
        fillImage4.captured_at = null;
        fillImage5.captured_at = undefined;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);
        image4.makeComplete(fillImage4);
        image5.makeComplete(fillImage5);

        expect(filter(image1)).toBe(false);
        expect(filter(image2)).toBe(true);
        expect(filter(image3)).toBe(true);
        expect(filter(image4)).toBe(false);
        expect(filter(image5)).toBe(false);
    });

    it("should compare >=, string", () => {
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createFilter([">=", "sequenceId", sequenceKey]);

        let coreImage1: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage2: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage3: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage4: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage5: CoreImageEnt = helper.createCoreImageEnt();

        coreImage1.sequence.id = "-1";
        coreImage2.sequence.id = sequenceKey;
        coreImage3.sequence.id = "1";
        coreImage4.sequence.id = null;
        coreImage5.sequence.id = undefined;

        let image1: Image = new Image(coreImage1);
        let image2: Image = new Image(coreImage2);
        let image3: Image = new Image(coreImage3);
        let image4: Image = new Image(coreImage4);
        let image5: Image = new Image(coreImage4);

        expect(filter(image1)).toBe(false);
        expect(filter(image2)).toBe(true);
        expect(filter(image3)).toBe(true);
        expect(filter(image4)).toBe(false);
        expect(filter(image5)).toBe(false);
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should compare <, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter(["<", "capturedAt", capturedAt]);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());
        let image4: Image = new Image(helper.createCoreImageEnt());
        let image5: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage4: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage5: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.captured_at = capturedAt - 1;
        fillImage2.captured_at = capturedAt;
        fillImage3.captured_at = capturedAt + 1;
        fillImage4.captured_at = null;
        fillImage5.captured_at = undefined;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);
        image4.makeComplete(fillImage4);
        image5.makeComplete(fillImage5);

        expect(filter(image1)).toBe(true);
        expect(filter(image2)).toBe(false);
        expect(filter(image3)).toBe(false);
        expect(filter(image4)).toBe(false);
        expect(filter(image5)).toBe(false);
    });

    it("should compare <, string", () => {
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createFilter(["<", "sequenceId", sequenceKey]);

        let coreImage1: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage2: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage3: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage4: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage5: CoreImageEnt = helper.createCoreImageEnt();

        coreImage1.sequence.id = "-1";
        coreImage2.sequence.id = sequenceKey;
        coreImage3.sequence.id = "1";
        coreImage4.sequence.id = null;
        coreImage5.sequence.id = undefined;

        let image1: Image = new Image(coreImage1);
        let image2: Image = new Image(coreImage2);
        let image3: Image = new Image(coreImage3);
        let image4: Image = new Image(coreImage4);
        let image5: Image = new Image(coreImage4);

        expect(filter(image1)).toBe(true);
        expect(filter(image2)).toBe(false);
        expect(filter(image3)).toBe(false);
        expect(filter(image4)).toBe(false);
        expect(filter(image5)).toBe(false);
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should compare <=, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter(["<=", "capturedAt", capturedAt]);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());
        let image4: Image = new Image(helper.createCoreImageEnt());
        let image5: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage4: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage5: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.captured_at = capturedAt - 1;
        fillImage2.captured_at = capturedAt;
        fillImage3.captured_at = capturedAt + 1;
        fillImage4.captured_at = null;
        fillImage5.captured_at = undefined;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);
        image4.makeComplete(fillImage4);
        image5.makeComplete(fillImage5);

        expect(filter(image1)).toBe(true);
        expect(filter(image2)).toBe(true);
        expect(filter(image3)).toBe(false);
        expect(filter(image4)).toBe(false);
        expect(filter(image5)).toBe(false);
    });

    it("should compare <=, string", () => {
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createFilter(["<=", "sequenceId", sequenceKey]);

        let coreImage1: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage2: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage3: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage4: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage5: CoreImageEnt = helper.createCoreImageEnt();

        coreImage1.sequence.id = "-1";
        coreImage2.sequence.id = sequenceKey;
        coreImage3.sequence.id = "1";
        coreImage4.sequence.id = null;
        coreImage5.sequence.id = undefined;

        let image1: Image = new Image(coreImage1);
        let image2: Image = new Image(coreImage2);
        let image3: Image = new Image(coreImage3);
        let image4: Image = new Image(coreImage4);
        let image5: Image = new Image(coreImage4);

        expect(filter(image1)).toBe(true);
        expect(filter(image2)).toBe(true);
        expect(filter(image3)).toBe(false);
        expect(filter(image4)).toBe(false);
        expect(filter(image5)).toBe(false);
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should test in, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter(["in", "capturedAt", capturedAt]);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());
        let image4: Image = new Image(helper.createCoreImageEnt());
        let image5: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage4: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage5: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.captured_at = capturedAt - 1;
        fillImage2.captured_at = capturedAt;
        fillImage3.captured_at = capturedAt + 1;
        fillImage4.captured_at = null;
        fillImage5.captured_at = undefined;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);
        image4.makeComplete(fillImage4);
        image5.makeComplete(fillImage5);

        expect(filter(image1)).toBe(false);
        expect(filter(image2)).toBe(true);
        expect(filter(image3)).toBe(false);
        expect(filter(image4)).toBe(false);
        expect(filter(image5)).toBe(false);
    });

    it("should test in, string", () => {
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createFilter(["in", "sequenceId", sequenceKey]);

        let coreImage1: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage2: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage3: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage4: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage5: CoreImageEnt = helper.createCoreImageEnt();

        coreImage1.sequence.id = "-1";
        coreImage2.sequence.id = sequenceKey;
        coreImage3.sequence.id = "1";
        coreImage4.sequence.id = null;
        coreImage5.sequence.id = undefined;

        let image1: Image = new Image(coreImage1);
        let image2: Image = new Image(coreImage2);
        let image3: Image = new Image(coreImage3);
        let image4: Image = new Image(coreImage4);
        let image5: Image = new Image(coreImage4);

        expect(filter(image1)).toBe(false);
        expect(filter(image2)).toBe(true);
        expect(filter(image3)).toBe(false);
        expect(filter(image4)).toBe(false);
        expect(filter(image5)).toBe(false);
    });

    it("should test in, null", () => {
        let creator: FilterCreator = new FilterCreator();

        let filter: FilterFunction = creator.createFilter(["in", "sequenceId", null]);

        let coreImage1: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage2: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage3: CoreImageEnt = helper.createCoreImageEnt();

        coreImage1.sequence.id = "1";
        coreImage2.sequence.id = null;
        coreImage3.sequence.id = undefined;

        let image1: Image = new Image(coreImage1);
        let image2: Image = new Image(coreImage2);
        let image3: Image = new Image(coreImage3);

        expect(filter(image1)).toBe(false);
        expect(filter(image2)).toBe(true);
        expect(filter(image3)).toBe(false);
    });

    it("should test in, multiple", () => {
        let creator: FilterCreator = new FilterCreator();

        let filter: FilterFunction = creator.createFilter(["in", "capturedAt", 0, 1]);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.captured_at = 0;
        fillImage2.captured_at = 1;
        fillImage3.captured_at = 2;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);

        expect(filter(image1)).toBe(true);
        expect(filter(image2)).toBe(true);
        expect(filter(image3)).toBe(false);
    });

    it("should test in, large multiple", () => {
        let creator: FilterCreator = new FilterCreator();

        let numbers: number[] = Array.apply(null, { length: 2000 }).map(Number.call, Number);
        let expression: SetMembershipFilterExpression = ["in", "capturedAt"]; expression.push(...numbers);

        let filter: FilterFunction = creator.createFilter(expression);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());
        let image4: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage4: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.captured_at = 0;
        fillImage2.captured_at = 1;
        fillImage3.captured_at = 1999;
        fillImage4.captured_at = 2000;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);
        image4.makeComplete(fillImage4);

        expect(filter(image1)).toBe(true);
        expect(filter(image2)).toBe(true);
        expect(filter(image3)).toBe(true);
        expect(filter(image4)).toBe(false);
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should test !in, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter(["!in", "capturedAt", capturedAt]);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());
        let image4: Image = new Image(helper.createCoreImageEnt());
        let image5: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage4: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage5: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.captured_at = capturedAt - 1;
        fillImage2.captured_at = capturedAt;
        fillImage3.captured_at = capturedAt + 1;
        fillImage4.captured_at = null;
        fillImage5.captured_at = undefined;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);
        image4.makeComplete(fillImage4);
        image5.makeComplete(fillImage5);

        expect(filter(image1)).toBe(true);
        expect(filter(image2)).toBe(false);
        expect(filter(image3)).toBe(true);
        expect(filter(image4)).toBe(true);
        expect(filter(image5)).toBe(true);
    });

    it("should test !in, string", () => {
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createFilter(["!in", "sequenceId", sequenceKey]);

        let coreImage1: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage2: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage3: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage4: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage5: CoreImageEnt = helper.createCoreImageEnt();

        coreImage1.sequence.id = "-1";
        coreImage2.sequence.id = sequenceKey;
        coreImage3.sequence.id = "1";
        coreImage4.sequence.id = null;
        coreImage5.sequence.id = undefined;

        let image1: Image = new Image(coreImage1);
        let image2: Image = new Image(coreImage2);
        let image3: Image = new Image(coreImage3);
        let image4: Image = new Image(coreImage4);
        let image5: Image = new Image(coreImage4);

        expect(filter(image1)).toBe(true);
        expect(filter(image2)).toBe(false);
        expect(filter(image3)).toBe(true);
        expect(filter(image4)).toBe(true);
        expect(filter(image5)).toBe(true);
    });

    it("should test !in, null", () => {
        let creator: FilterCreator = new FilterCreator();

        let filter: FilterFunction = creator.createFilter(["!in", "sequenceId", null]);

        let coreImage1: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage2: CoreImageEnt = helper.createCoreImageEnt();
        let coreImage3: CoreImageEnt = helper.createCoreImageEnt();

        coreImage1.sequence.id = "1";
        coreImage2.sequence.id = null;
        coreImage3.sequence.id = undefined;

        let image1: Image = new Image(coreImage1);
        let image2: Image = new Image(coreImage2);
        let image3: Image = new Image(coreImage3);

        expect(filter(image1)).toBe(true);
        expect(filter(image2)).toBe(false);
        expect(filter(image3)).toBe(true);
    });

    it("should test !in, multiple", () => {
        let creator: FilterCreator = new FilterCreator();

        let filter: FilterFunction = creator.createFilter(["!in", "capturedAt", 0, 1]);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.captured_at = 0;
        fillImage2.captured_at = 1;
        fillImage3.captured_at = 2;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);

        expect(filter(image1)).toBe(false);
        expect(filter(image2)).toBe(false);
        expect(filter(image3)).toBe(true);
    });

    it("should test !in, large multiple", () => {
        let creator: FilterCreator = new FilterCreator();

        let numbers: number[] = Array.apply(null, { length: 2000 }).map(Number.call, Number);
        let expression: SetMembershipFilterExpression = ["!in", "capturedAt"]; expression.push(...numbers);

        let filter: FilterFunction = creator.createFilter(expression);

        let image1: Image = new Image(helper.createCoreImageEnt());
        let image2: Image = new Image(helper.createCoreImageEnt());
        let image3: Image = new Image(helper.createCoreImageEnt());
        let image4: Image = new Image(helper.createCoreImageEnt());

        let fillImage1: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage2: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage3: SpatialImageEnt = helper.createSpatialImageEnt();
        let fillImage4: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage1.captured_at = 0;
        fillImage2.captured_at = 1;
        fillImage3.captured_at = 1999;
        fillImage4.captured_at = 2000;

        image1.makeComplete(fillImage1);
        image2.makeComplete(fillImage2);
        image3.makeComplete(fillImage3);
        image4.makeComplete(fillImage4);

        expect(filter(image1)).toBe(false);
        expect(filter(image2)).toBe(false);
        expect(filter(image3)).toBe(false);
        expect(filter(image4)).toBe(true);
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should test all", () => {
        let creator: FilterCreator = new FilterCreator();

        let image: Image = new Image(helper.createCoreImageEnt());
        let fillImage: SpatialImageEnt = helper.createSpatialImageEnt();
        fillImage.captured_at = 1;
        image.makeComplete(fillImage);

        let filter1: FilterFunction = creator.createFilter(["all"]);
        expect(filter1(image)).toBe(true);

        let filter2: FilterFunction = creator.createFilter(["all", ["==", "capturedAt", 1]]);
        expect(filter2(image)).toBe(true);

        let filter3: FilterFunction = creator.createFilter(["all", ["==", "capturedAt", 0]]);
        expect(filter3(image)).toBe(false);

        let filter4: FilterFunction = creator.createFilter(["all", ["==", "capturedAt", 0], ["==", "capturedAt", 1]]);
        expect(filter4(image)).toBe(false);
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should default to true", () => {
        let creator: FilterCreator = new FilterCreator();

        let image: Image = new Image(helper.createCoreImageEnt());

        let filter1: FilterFunction = creator.createFilter(null);
        expect(filter1(image)).toBe(true);

        let filter2: FilterFunction = creator.createFilter(undefined);
        expect(filter2(image)).toBe(true);

        let filter3: FilterFunction = creator.createFilter(["all"]);
        expect(filter3(image)).toBe(true);
    });
});

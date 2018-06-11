import {
    OutlineRenderTag,
    OutlineTag,
    PointGeometry,
    RectGeometry,
    RenderTag,
    SpotRenderTag,
    SpotTag,
    Tag,
    TagSet,
} from "../../../src/Component";
import {Transform} from "../../../src/Geo";

import {TransformHelper} from "../../helper/TransformHelper.spec";

class UnsupportedTag extends Tag {}

describe("TagSet.ctor", () => {
    it("should be defined", () => {
        const tagSet: TagSet = new TagSet();

        expect(tagSet).toBeDefined();
    });

    it("should not be active", () => {
        const tagSet: TagSet = new TagSet();

        expect(tagSet.active).toBe(false);
    });
});

describe("TagSet.addDeactivated", () => {
    it("should add a single tag", () => {
        const tagSet: TagSet = new TagSet();
        const tag: SpotTag = new SpotTag("id-1", new PointGeometry([0.5, 0.5]));

        tagSet.addDeactivated([tag]);

        const result: Tag = tagSet.getDeactivated("id-1");

        expect(result).toBe(tag);
        expect(result.id).toBe("id-1");
    });

    it("should throw if tag type is not supported", () => {
        const tagSet: TagSet = new TagSet();
        const transform: Transform = new TransformHelper().createTransform();
        tagSet.activate(transform);
        const tag: UnsupportedTag = new UnsupportedTag("id-1", new PointGeometry([0.5, 0.5]));

        expect(() => { tagSet.addDeactivated([tag]); }).toThrowError(Error);
    });

    it("should add multiple tags", () => {
        const tagSet: TagSet = new TagSet();
        const tag1: SpotTag = new SpotTag("id-1", new PointGeometry([0.5, 0.5]));
        const tag2: SpotTag = new SpotTag("id-2", new PointGeometry([0.5, 0.5]));

        tagSet.addDeactivated([tag1, tag2]);

        const result: Tag[] = tagSet.getAllDeactivated();

        expect(result.length).toBe(2);

        const ids: string[] = result.map((tag: Tag): string => { return tag.id; });
        expect(ids.indexOf(tag1.id)).not.toBe(-1);
        expect(ids.indexOf(tag2.id)).not.toBe(-1);
    });
});

describe("TagSet.removeDeactivated", () => {
    it("should remove a single tag", () => {
        const tagSet: TagSet = new TagSet();
        const tag: SpotTag = new SpotTag("id-1", new PointGeometry([0.5, 0.5]));

        tagSet.addDeactivated([tag]);
        tagSet.removeDeactivated([tag.id]);

        const result: Tag = tagSet.getDeactivated("id-1");

        expect(result).toBeUndefined();
    });

    it("should remove multiple tags", () => {
        const tagSet: TagSet = new TagSet();
        const tag1: SpotTag = new SpotTag("id-1", new PointGeometry([0.5, 0.5]));
        const tag2: SpotTag = new SpotTag("id-2", new PointGeometry([0.5, 0.5]));

        tagSet.addDeactivated([tag1, tag2]);
        tagSet.removeDeactivated([tag1.id, tag2.id]);

        const result: Tag[] = tagSet.getAllDeactivated();

        expect(result.length).toBe(0);
    });

    it("should remove one of multiple tags", () => {
        const tagSet: TagSet = new TagSet();
        const tag1: SpotTag = new SpotTag("id-1", new PointGeometry([0.5, 0.5]));
        const tag2: SpotTag = new SpotTag("id-2", new PointGeometry([0.5, 0.5]));

        tagSet.addDeactivated([tag1, tag2]);
        tagSet.removeDeactivated([tag1.id]);

        const result1: Tag = tagSet.getDeactivated("id-1");
        expect(result1).toBeUndefined();

        const result2: Tag = tagSet.getDeactivated("id-2");
        expect(result2).toBeDefined();
        expect(result2.id).toBe(tag2.id);
    });
});

describe("TagSet.removeAll", () => {
    it("should remove a single tag", () => {
        const tagSet: TagSet = new TagSet();
        const tag: SpotTag = new SpotTag("id-1", new PointGeometry([0.5, 0.5]));

        tagSet.addDeactivated([tag]);
        tagSet.removeAllDeactivated();

        const result: Tag[] = tagSet.getAllDeactivated();

        expect(result.length).toBe(0);
    });

    it("should remove multiple tags", () => {
        const tagSet: TagSet = new TagSet();
        const tag1: SpotTag = new SpotTag("id-1", new PointGeometry([0.5, 0.5]));
        const tag2: SpotTag = new SpotTag("id-2", new PointGeometry([0.5, 0.5]));

        tagSet.addDeactivated([tag1, tag2]);
        tagSet.removeAllDeactivated();

        const result: Tag[] = tagSet.getAllDeactivated();

        expect(result.length).toBe(0);
    });
});

describe("TagSet.activate", () => {
    it("should be active after activation", () => {
        const tagSet: TagSet = new TagSet();
        tagSet.activate(new TransformHelper().createTransform());

        expect(tagSet.active).toBe(true);
    });

    it("should throw on deactivate methods when active", () => {
        const tagSet: TagSet = new TagSet();
        tagSet.activate(new TransformHelper().createTransform());

        expect(() => { tagSet.addDeactivated([]); }).toThrowError(Error);
        expect(() => { tagSet.removeDeactivated([]); }).toThrowError(Error);
        expect(() => { tagSet.removeAllDeactivated(); }).toThrowError(Error);
    });
});

describe("TagSet.deactivate", () => {
    it("should not be active after deactivation", () => {
        const tagSet: TagSet = new TagSet();
        tagSet.activate(new TransformHelper().createTransform());
        tagSet.deactivate();

        expect(tagSet.active).toBe(false);
    });

    it("should throw on deactivate methods when active", () => {
        const tagSet: TagSet = new TagSet();
        tagSet.activate(new TransformHelper().createTransform());
        tagSet.deactivate();

        expect(() => { tagSet.add([], new TransformHelper().createTransform()); }).toThrowError(Error);
        expect(() => { tagSet.remove([]); }).toThrowError(Error);
        expect(() => { tagSet.removeAll(); }).toThrowError(Error);
    });
});

describe("TagSet.add", () => {
    it("should add a single tag and create a spot render tag", () => {
        const tagSet: TagSet = new TagSet();
        const transform: Transform = new TransformHelper().createTransform();
        tagSet.activate(transform);

        const tag: SpotTag = new SpotTag("id-1", new PointGeometry([0.5, 0.5]));

        tagSet.add([tag], transform);

        const result: RenderTag<Tag> = tagSet.get("id-1");

        expect(result instanceof SpotRenderTag).toBe(true);
        expect(result.tag).toBe(tag);
        expect(result.tag.id).toBe("id-1");
    });

    it("should add a single tag and create an outline render tag", () => {
        const tagSet: TagSet = new TagSet();
        const transform: Transform = new TransformHelper().createTransform();
        tagSet.activate(transform);

        const tag: OutlineTag = new OutlineTag("id-1", new RectGeometry([0.5, 0.5]));

        tagSet.add([tag], transform);

        const result: RenderTag<Tag> = tagSet.get("id-1");

        expect(result instanceof OutlineRenderTag).toBe(true);
        expect(result.tag).toBe(tag);
        expect(result.tag.id).toBe("id-1");
    });

    it("should throw if tag type is not supported", () => {
        const tagSet: TagSet = new TagSet();
        const transform: Transform = new TransformHelper().createTransform();
        tagSet.activate(transform);
        const tag: UnsupportedTag = new UnsupportedTag("id-1", new PointGeometry([0.5, 0.5]));

        expect(() => { tagSet.add([tag], transform); }).toThrowError(Error);
    });

    it("should add multiple tags", () => {
        const tagSet: TagSet = new TagSet();
        const transform: Transform = new TransformHelper().createTransform();
        tagSet.activate(transform);

        const tag1: SpotTag = new SpotTag("id-1", new PointGeometry([0.5, 0.5]));
        const tag2: SpotTag = new SpotTag("id-2", new PointGeometry([0.5, 0.5]));

        tagSet.add([tag1, tag2], transform);

        const result: RenderTag<Tag>[] = tagSet.getAll();

        expect(result.length).toBe(2);

        const ids: string[] = result.map((tag: RenderTag<Tag>): string => { return tag.tag.id; });
        expect(ids.indexOf(tag1.id)).not.toBe(-1);
        expect(ids.indexOf(tag2.id)).not.toBe(-1);
    });
});

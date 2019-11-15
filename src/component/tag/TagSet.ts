import {Observable, Subject} from "rxjs";

import {
    OutlineRenderTag,
    OutlineTag,
    RenderTag,
    SpotRenderTag,
    SpotTag,
    Tag,
} from "../../Component";
import {Transform} from "../../Geo";
import ExtremePointTag from "./tag/ExtremePointTag";
import ExtremePointRenderTag from "./tag/ExtremePointRenderTag";

export class TagSet {
    private _active: boolean;

    private _hash: { [id: string]: RenderTag<Tag> };
    private _hashDeactivated: { [id: string]: Tag };

    private _notifyChanged$: Subject<TagSet>;

    constructor() {
        this._active = false;
        this._hash = {};
        this._hashDeactivated = {};
        this._notifyChanged$ = new Subject<TagSet>();
    }

    public get active(): boolean {
        return this._active;
    }

    public get changed$(): Observable<TagSet> {
        return this._notifyChanged$;
    }

    public activate(transform: Transform): void {
        if (this._active) {
            return;
        }

        for (const id in this._hashDeactivated) {
            if (!this._hashDeactivated.hasOwnProperty(id)) {
                continue;
            }

            const tag: Tag = this._hashDeactivated[id];
            this._add(tag, transform);
        }

        this._hashDeactivated = {};
        this._active = true;

        this._notifyChanged$.next(this);
    }

    public deactivate(): void {
        if (!this._active) {
            return;
        }

        for (const id in this._hash) {
            if (!this._hash.hasOwnProperty(id)) {
                continue;
            }

            this._hashDeactivated[id] = this._hash[id].tag;
        }

        this._hash = {};
        this._active = false;
    }

    public add(tags: Tag[], transform: Transform): void {
        this._assertActivationState(true);

        for (const tag of tags) {
            this._add(tag, transform);
        }

        this._notifyChanged$.next(this);
    }

    public addDeactivated(tags: Tag[]): void {
        this._assertActivationState(false);

        for (const tag of tags) {
            if (!(
                tag instanceof OutlineTag ||
                tag instanceof SpotTag ||
                tag instanceof ExtremePointTag
                )) {
                throw new Error("Tag type not supported");
            }

            this._hashDeactivated[tag.id] = tag;
        }
    }

    public get(id: string): RenderTag<Tag> {
        return this.has(id) ? this._hash[id] : undefined;
    }

    public getAll(): RenderTag<Tag>[] {
        const hash: { [id: string]: RenderTag<Tag> } = this._hash;

        return Object.keys(hash)
            .map(
                (id: string): RenderTag<Tag> => {
                    return hash[id];
                });
    }

    public getAllDeactivated(): Tag[] {
        const hashDeactivated: { [id: string]: Tag } = this._hashDeactivated;

        return Object.keys(hashDeactivated)
            .map(
                (id: string): Tag => {
                    return hashDeactivated[id];
                });
    }

    public getDeactivated(id: string): Tag {
        return this.hasDeactivated(id) ? this._hashDeactivated[id] : undefined;
    }

    public has(id: string): boolean {
        return id in this._hash;
    }

    public hasDeactivated(id: string): boolean {
        return id in this._hashDeactivated;
    }

    public remove(ids: string[]): void {
        this._assertActivationState(true);

        const hash: { [id: string]: RenderTag<Tag> } = this._hash;
        for (const id of ids) {
            if (!(id in hash)) {
                continue;
            }

            delete hash[id];
        }

        this._notifyChanged$.next(this);
    }

    public removeAll(): void {
        this._assertActivationState(true);

        this._hash = {};

        this._notifyChanged$.next(this);
    }

    public removeAllDeactivated(): void {
        this._assertActivationState(false);

        this._hashDeactivated = {};
    }

    public removeDeactivated(ids: string[]): void {
        this._assertActivationState(false);

        const hashDeactivated: { [id: string]: Tag } = this._hashDeactivated;
        for (const id of ids) {
            if (!(id in hashDeactivated)) {
                continue;
            }

            delete hashDeactivated[id];
        }
    }

    private _add(tag: Tag, transform: Transform): void {
        if (tag instanceof OutlineTag) {
            this._hash[tag.id] = new OutlineRenderTag(<OutlineTag>tag, transform);
        } else if (tag instanceof SpotTag) {
            this._hash[tag.id] = new SpotRenderTag(<SpotTag>tag, transform);
        } else if (tag instanceof ExtremePointTag) {
            this._hash[tag.id] = new ExtremePointRenderTag(<ExtremePointTag>tag, transform);
        } else {
            throw new Error("Tag type not supported");
        }
    }

    private _assertActivationState(should: boolean): void {
        if (should !== this._active) {
            throw new Error("Tag set not in correct state for operation.");
        }
    }
}

export default TagSet;

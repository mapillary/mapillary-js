/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";

import {ITag} from "../../Component";

type TagData = { [id: string]: ITag };

interface ITagDataOperation extends Function {
    (tags: TagData): TagData;
}

export class TagSet {
    private _tagDataOperation$: rx.Subject<ITagDataOperation> = new rx.Subject<ITagDataOperation>();
    private _tagData$: rx.Observable<TagData>;

    private _set$: rx.Subject<ITag[]> = new rx.Subject<ITag[]>();

    private _notifyTagChanged$: rx.Subject<void> = new rx.Subject<void>();

    constructor() {
        this._tagData$ = this._tagDataOperation$
            .scan<TagData>(
                (tagData: TagData, operation: ITagDataOperation): TagData => {
                    return operation(tagData);
                },
                {})
            .shareReplay(1);

        this._set$
            .map<ITagDataOperation>(
                (tags: ITag[]): ITagDataOperation => {
                    return (tagData: TagData): TagData => {
                        for (let key of Object.keys(tagData)) {
                            delete tagData[key];
                        }

                        for (let tag of tags) {
                            tagData[tag.key] = tag;
                        }

                        return tagData;
                    };
                })
            .subscribe(this._tagDataOperation$);

        this._notifyTagChanged$
            .map<ITagDataOperation>(
                (): ITagDataOperation => {
                    return (tagData: TagData): TagData => {
                       return tagData;
                    };
                })
            .subscribe(this._tagDataOperation$);
    }

    public get tagData$(): rx.Observable<TagData> {
        return this._tagData$;
    }

    public get set$(): rx.Subject<ITag[]> {
        return this._set$;
    }

    public get notifyTagChanged$(): rx.Subject<void> {
        return this._notifyTagChanged$;
    }
}

export default TagSet;

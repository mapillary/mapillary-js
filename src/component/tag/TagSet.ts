/// <reference path="../../../typings/index.d.ts" />

import * as rx from "rx";

import {Tag} from "../../Component";

export type TagData = { [id: string]: Tag };

interface ITagDataOperation extends Function {
    (tags: TagData): TagData;
}

export class TagSet {
    private _tagDataOperation$: rx.Subject<ITagDataOperation> = new rx.Subject<ITagDataOperation>();
    private _tagData$: rx.Observable<TagData>;

    private _set$: rx.Subject<Tag[]> = new rx.Subject<Tag[]>();

    constructor() {
        this._tagData$ = this._tagDataOperation$
            .scan<TagData>(
                (tagData: TagData, operation: ITagDataOperation): TagData => {
                    return operation(tagData);
                },
                {})
            .share();

        this._set$
            .map<ITagDataOperation>(
                (tags: Tag[]): ITagDataOperation => {
                    return (tagData: TagData): TagData => {
                        for (let key of Object.keys(tagData)) {
                            delete tagData[key];
                        }

                        for (let tag of tags) {
                            tagData[tag.id] = tag;
                        }

                        return tagData;
                    };
                })
            .subscribe(this._tagDataOperation$);
    }

    public get tagData$(): rx.Observable<TagData> {
        return this._tagData$;
    }

    public get set$(): rx.Subject<Tag[]> {
        return this._set$;
    }
}

export default TagSet;

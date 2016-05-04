/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";

import {TagBase} from "../../Component";

type TagData = { [id: string]: TagBase };

interface ITagDataOperation extends Function {
    (tags: TagData): TagData;
}

export class TagSet {
    private _tagDataOperation$: rx.Subject<ITagDataOperation> = new rx.Subject<ITagDataOperation>();
    private _tagData$: rx.Observable<TagData>;

    private _set$: rx.Subject<TagBase[]> = new rx.Subject<TagBase[]>();

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
                (tags: TagBase[]): ITagDataOperation => {
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

    public get set$(): rx.Subject<TagBase[]> {
        return this._set$;
    }
}

export default TagSet;

/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";

import {INodeTags, ITag, ITagData} from "../../Component";

interface ITagDataOperation extends Function {
    (tagData: ITagData): ITagData;
}

export class TagSet {
    private _tagDataOperation$: rx.Subject<ITagDataOperation>;
    private _tagData$: rx.Observable<ITagData>;

    private _set$: rx.Subject<[string, ITag[]]>;
    private _add$: rx.Subject<[string, ITag]>;
    private _remove$: rx.Subject<[string, string]>;
    private _clear$: rx.Subject<string>;

    private _clearAll$: rx.Subject<void>;

    constructor() {
        this._tagDataOperation$ = new rx.Subject<ITagDataOperation>();

        this._set$ = new rx.Subject<[string, ITag[]]>();
        this._add$ = new rx.Subject<[string, ITag]>();
        this._remove$ = new rx.Subject<[string, string]>();
        this._clear$ = new rx.Subject<string>();

        this._clearAll$ = new rx.Subject<void>();

        this._tagData$ = this._tagDataOperation$
            .scan<ITagData>(
                (tagData: ITagData, operation: ITagDataOperation): ITagData => {
                    return operation(tagData);
                },
                {})
            .shareReplay(1);

        this._set$
            .map<ITagDataOperation>(
                (nts: [string, ITag[]]): ITagDataOperation => {
                    return (tagData: ITagData): ITagData => {
                        let nodeKey: string = nts[0];
                        let tags: ITag[] = nts[1];

                        tagData[nodeKey] = { approve: {}, change: {}, create: {}, reject: {} };

                        for (let tag of tags) {
                            tagData[nodeKey].approve[tag.key] = tag;
                        }

                        return;
                    };
                })
            .subscribe(this._tagDataOperation$);

        this._add$
            .map<ITagDataOperation>(
                (nt: [string, ITag]): ITagDataOperation => {
                    return (tagData: ITagData): ITagData => {
                        let nodeKey: string = nt[0];
                        let tag: ITag = nt[1];

                        tagData[nodeKey].create[tag.key] = tag;

                        return tagData;
                    };
                })
            .subscribe(this._tagDataOperation$);

        this._remove$
            .map<ITagDataOperation>(
                (nt: [string, string]): ITagDataOperation => {
                    return (tagData: ITagData): ITagData => {
                        let nodeKey: string = nt[0];
                        let tagKey: string = nt[1];

                        let nodeTags: INodeTags = tagData[nodeKey];

                        if (tagKey in nodeTags.approve) {
                            let tag: ITag = nodeTags.approve[tagKey];
                            nodeTags.reject[tagKey] = tag;

                            delete nodeTags.approve[tagKey];
                        }

                        if (tagKey in nodeTags.change) {
                            let tag: ITag = nodeTags.change[tagKey];
                            nodeTags.reject[tagKey] = tag;

                            delete nodeTags.change[tagKey];
                        }

                        if (tagKey in nodeTags.create) {
                            delete nodeTags.create[tagKey];
                        }

                        return tagData;
                    };
                })
            .subscribe(this._tagDataOperation$);

        this._clear$
            .map<ITagDataOperation>(
                (nodeKey: string): ITagDataOperation => {
                    return (tagData: ITagData): ITagData => {
                        delete tagData[nodeKey];

                        return tagData;
                    };
                })
            .subscribe(this._tagDataOperation$);

        this._clearAll$
            .map<ITagDataOperation>(
                (): ITagDataOperation => {
                    return (tagData: ITagData): ITagData => {
                        for (let nodeKey in tagData) {
                            if (!tagData.hasOwnProperty(nodeKey)) {
                                continue;
                            }

                            delete tagData[nodeKey];
                        }

                        return tagData;
                    };
                })
            .subscribe(this._tagDataOperation$);
    }
}

export default TagSet;

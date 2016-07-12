import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/operator/map";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/share";

import {Tag} from "../../Component";

export type TagData = { [id: string]: Tag };

interface ITagDataOperation extends Function {
    (tags: TagData): TagData;
}

export class TagSet {
    private _tagDataOperation$: Subject<ITagDataOperation> = new Subject<ITagDataOperation>();
    private _tagData$: Observable<TagData>;

    private _set$: Subject<Tag[]> = new Subject<Tag[]>();

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

    public get tagData$(): Observable<TagData> {
        return this._tagData$;
    }

    public get set$(): Subject<Tag[]> {
        return this._set$;
    }
}

export default TagSet;

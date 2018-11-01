import {
    concat as observableConcat,
    merge as observableMerge,
    of as observableOf,
    Observable,
} from "rxjs";

import {
    map,
    filter,
    pairwise,
    startWith,
    switchMap,
    takeWhile,
} from "rxjs/operators";

import {MouseService} from "../../Viewer";

export class MouseOperator {
    public static filteredPairwiseMouseDrag$(
        name: string,
        mouseService: MouseService): Observable<[MouseEvent, MouseEvent]> {

        return mouseService
            .filtered$(name, mouseService.mouseDragStart$).pipe(
            switchMap(
                (mouseDragStart: MouseEvent): Observable<MouseEvent> => {
                    const mouseDragging$: Observable<MouseEvent> = observableConcat(
                        observableOf(mouseDragStart),
                        mouseService
                            .filtered$(name, mouseService.mouseDrag$));

                    const mouseDragEnd$: Observable<MouseEvent> = mouseService
                        .filtered$(name, mouseService.mouseDragEnd$).pipe(
                        map(
                            (): MouseEvent => {
                                return null;
                            }));

                    return observableMerge(mouseDragging$, mouseDragEnd$).pipe(
                        takeWhile(
                            (e: MouseEvent): boolean => {
                                return !!e;
                            }),
                        startWith(null));
                }),
            pairwise(),
            filter(
                (pair: [MouseEvent, MouseEvent]): boolean => {
                    return pair[0] != null && pair[1] != null;
                }));
    }
}

export default MouseOperator;

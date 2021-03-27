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

import { MouseService } from "../../viewer/MouseService";

export class MouseOperator {
    public static filteredPairwiseMouseDrag$(
        name: string,
        mouseService: MouseService): Observable<[MouseEvent, MouseEvent]> {
        return this._filteredPairwiseMouseDrag$(
            name,
            mouseService,
            mouseService.mouseDragStart$,
            mouseService.mouseDrag$,
            mouseService.mouseDragEnd$);
    }

    public static filteredPairwiseMouseRightDrag$(
        name: string,
        mouseService: MouseService): Observable<[MouseEvent, MouseEvent]> {
        return this._filteredPairwiseMouseDrag$(
            name,
            mouseService,
            mouseService.mouseRightDragStart$,
            mouseService.mouseRightDrag$,
            mouseService.mouseRightDragEnd$);
    }

    private static _filteredPairwiseMouseDrag$(
        name: string,
        mouseService: MouseService,
        mouseDragStart$: Observable<MouseEvent>,
        mouseDrag$: Observable<MouseEvent>,
        mouseDragEnd$: Observable<MouseEvent | FocusEvent>):
        Observable<[MouseEvent, MouseEvent]> {
        return mouseService
            .filtered$(name, mouseDragStart$).pipe(
                switchMap(
                    (mouseDragStart: MouseEvent): Observable<MouseEvent> => {
                        const dragging$: Observable<MouseEvent> = observableConcat(
                            observableOf(mouseDragStart),
                            mouseService
                                .filtered$(name, mouseDrag$));

                        const dragEnd$: Observable<MouseEvent> = mouseService
                            .filtered$(name, mouseDragEnd$).pipe(
                                map(
                                    (): MouseEvent => {
                                        return null;
                                    }));

                        return observableMerge(dragging$, dragEnd$).pipe(
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

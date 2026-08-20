import {
    BehaviorSubject,
    Observable,
    of as observableOf,
    Subject,
} from "rxjs";

import { GraphMode } from "../../src/graph/GraphMode";
import { GraphService } from "../../src/graph/GraphService";
import { Image } from "../../src/graph/Image";
import { Sequence } from "../../src/graph/Sequence";
import { NavigationDirection } from "../../src/graph/edge/NavigationDirection";
import { NavigationEdgeStatus } from "../../src/graph/interfaces/NavigationEdgeStatus";
import { State } from "../../src/state/State";
import { StateService } from "../../src/state/StateService";
import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";
import { IAnimationState } from "../../src/state/interfaces/IAnimationState";
import { PlayService } from "../../src/viewer/PlayService";

/**
 * Edge targets are deliberately outside the sequence so that the images the
 * trajectory append loop requests can be told apart from the ones the
 * prefetch window requests.
 */
const EDGE_SUFFIX: string = "__edge";

function createEdgeStatus(id: string): NavigationEdgeStatus {
    const target: string = `${id}${EDGE_SUFFIX}`;

    return {
        cached: true,
        edges: [
            {
                data: {
                    direction: NavigationDirection.Next,
                    worldMotionAzimuth: 0,
                },
                source: id,
                target,
            },
            {
                data: {
                    direction: NavigationDirection.Prev,
                    worldMotionAzimuth: 0,
                },
                source: id,
                target,
            },
        ],
    };
}

function createImage(id: string, sequenceId: string): Image {
    return <Image>{
        assetsCached: true,
        capturedAt: 0,
        id: id,
        sequenceEdges$: observableOf(createEdgeStatus(id)),
        sequenceId: sequenceId,
        spatialEdges$: observableOf(createEdgeStatus(id)),
    };
}

function createSequence(sequenceId: string, count: number): Sequence {
    const imageIds: string[] = [];
    for (let i: number = 0; i < count; i++) {
        imageIds.push(`${sequenceId}_${i}`);
    }

    return new Sequence({ id: sequenceId, image_ids: imageIds });
}

interface Harness {
    cacheSequence$: Subject<Sequence>;
    cacheSequenceImages$: Subject<Sequence>;
    cacheSequenceImagesSpy: jest.Mock;
    currentImage$: Subject<Image>;
    frame: (lastId: string, imagesAhead: number) => void;
    graphMode$: BehaviorSubject<GraphMode>;
    playService: PlayService;
    prefetched: () => string[];
}

function createHarness(): Harness {
    const currentImage$: Subject<Image> = new Subject<Image>();
    const currentState$: Subject<AnimationFrame> = new Subject<AnimationFrame>();
    const state$: BehaviorSubject<State> =
        new BehaviorSubject<State>(State.Traversing);

    const cacheSequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
    const cacheSequenceImagesSubject$: Subject<Sequence> =
        new Subject<Sequence>();

    const graphMode$: BehaviorSubject<GraphMode> =
        new BehaviorSubject<GraphMode>(GraphMode.Spatial);

    const requestedIds: string[] = [];

    const cacheSequenceImagesSpy: jest.Mock = jest.fn(
        (): Observable<Sequence> => cacheSequenceImagesSubject$);

    const graphService: unknown = {
        cacheImage$: (id: string): Observable<Image> => {
            requestedIds.push(id);

            return observableOf(createImage(id, "seq"));
        },
        cacheSequence$: (): Observable<Sequence> => cacheSequenceSubject$,
        cacheSequenceImages$: cacheSequenceImagesSpy,
        graphMode$: graphMode$,
        setGraphMode: (mode: GraphMode): void => { graphMode$.next(mode); },
    };

    const stateService: unknown = {
        appendImagess: (): void => { /*noop*/ },
        clearPriorImages: (): void => { /*noop*/ },
        currentImage$: currentImage$,
        currentState$: currentState$,
        cutImages: (): void => { /*noop*/ },
        setSpeed: (): void => { /*noop*/ },
        state$: state$,
    };

    const playService: PlayService = new PlayService(
        <GraphService>graphService,
        <StateService>stateService);

    const frame = (lastId: string, imagesAhead: number): void => {
        const lastImage: Image = createImage(lastId, "seq");
        const state: unknown = {
            currentImage: lastImage,
            currentIndex: 0,
            imagesAhead: imagesAhead,
            lastImage: lastImage,
            trajectory: [lastImage],
        };

        currentState$.next({ fps: 60, id: 0, state: <IAnimationState>state });
    };

    const prefetched = (): string[] =>
        requestedIds.filter((id: string): boolean => {
            return !id.endsWith(EDGE_SUFFIX);
        });

    return {
        cacheSequence$: cacheSequenceSubject$,
        cacheSequenceImages$: cacheSequenceImagesSubject$,
        cacheSequenceImagesSpy: cacheSequenceImagesSpy,
        currentImage$: currentImage$,
        frame: frame,
        graphMode$: graphMode$,
        playService: playService,
        prefetched: prefetched,
    };
}

describe("PlayService.play", () => {
    it("should cache images before the sequence images request resolves", () => {
        const harness: Harness = createHarness();

        // Above PlayService.sequenceSpeed, so the graph mode is sequence.
        harness.playService.setSpeed(1);
        harness.playService.play();

        expect(harness.graphMode$.value).toBe(GraphMode.Sequence);

        harness.currentImage$.next(createImage("seq_100", "seq"));

        // The sequence request resolves while the sequence images request is
        // still in flight, as it is for seconds on a long sequence.
        harness.cacheSequence$.next(createSequence("seq", 1000));
        harness.frame("seq_100", 0);

        expect(harness.cacheSequenceImagesSpy).toHaveBeenCalledTimes(1);
        expect(harness.prefetched().length).toBeGreaterThan(0);
        expect(harness.prefetched()[0]).toBe("seq_101");
    });

    it("should request a window of images ahead of the trajectory", () => {
        const harness: Harness = createHarness();

        harness.playService.setSpeed(1);
        harness.playService.play();
        harness.currentImage$.next(createImage("seq_100", "seq"));
        harness.cacheSequence$.next(createSequence("seq", 1000));
        harness.frame("seq_100", 0);

        // Images ahead is 50 at maximum speed.
        expect(harness.prefetched().length).toBe(50);
        expect(harness.prefetched()[0]).toBe("seq_101");
        expect(harness.prefetched()[49]).toBe("seq_150");

        const requested: number = harness.prefetched().length;
        harness.frame("seq_150", 50);

        expect(harness.prefetched().length).toBe(requested);

        harness.frame("seq_150", 45);

        expect(harness.prefetched().slice(requested))
            .toEqual([
                "seq_151",
                "seq_152",
                "seq_153",
                "seq_154",
                "seq_155",
            ]);
    });

    it("should not request from the start of another sequence", () => {
        const harness: Harness = createHarness();

        // Spatial mode, so the request window is exercised on its own.
        harness.playService.setSpeed(0.2);
        harness.playService.play();
        harness.currentImage$.next(createImage("seq_100", "seq"));
        harness.cacheSequence$.next(createSequence("seq", 1000));

        harness.frame("other_7", 0);

        expect(harness.prefetched()).toEqual([]);

        harness.frame("seq_100", 0);

        expect(harness.prefetched()[0]).toBe("seq_101");
    });

    it("should cache images when the sequence images request fails", () => {
        const harness: Harness = createHarness();

        harness.playService.setSpeed(1);
        harness.playService.play();
        harness.currentImage$.next(createImage("seq_100", "seq"));
        harness.cacheSequence$.next(createSequence("seq", 1000));
        harness.frame("seq_100", 0);

        const requested: number = harness.prefetched().length;
        expect(requested).toBe(50);

        jest.spyOn(console, "error").mockImplementation((): void => { /*noop*/ });
        harness.cacheSequenceImages$.error(new Error("Failed"));

        harness.frame("seq_150", 45);

        expect(harness.prefetched().length).toBeGreaterThan(requested);
    });

    it("should not request sequence images in spatial mode", () => {
        const harness: Harness = createHarness();

        // Below PlayService.sequenceSpeed, so the graph mode is spatial.
        harness.playService.setSpeed(0.2);
        harness.playService.play();

        expect(harness.graphMode$.value).toBe(GraphMode.Spatial);

        harness.currentImage$.next(createImage("seq_100", "seq"));
        harness.cacheSequence$.next(createSequence("seq", 1000));
        harness.frame("seq_100", 0);

        expect(harness.cacheSequenceImagesSpy).not.toHaveBeenCalled();
        expect(harness.prefetched().length).toBeGreaterThan(0);
    });

    it("should reverse the request window when playing backwards", () => {
        const harness: Harness = createHarness();

        harness.playService.setSpeed(1);
        harness.playService.setDirection(NavigationDirection.Prev);
        harness.playService.play();
        harness.currentImage$.next(createImage("seq_100", "seq"));
        harness.cacheSequence$.next(createSequence("seq", 1000));
        harness.frame("seq_100", 0);

        expect(harness.prefetched()[0]).toBe("seq_99");
        expect(harness.prefetched()[49]).toBe("seq_50");
    });
});

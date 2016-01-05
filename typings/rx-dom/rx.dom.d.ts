declare module Rx {
    export interface IDisposable {
        dispose(): void;
    }

    export interface IScheduler {
        now(): number;
        schedule<TState>(state: TState, action: (scheduler: IScheduler, state: TState) => IDisposable): IDisposable;
        scheduleFuture<TState>(state: TState, dueTime: number | Date, action: (scheduler: IScheduler, state: TState) => IDisposable): IDisposable;
    }

    export interface IRequestAnimationFrameScheduler extends IScheduler { }

    export interface SchedulerStatic {
        requestAnimationFrame: IRequestAnimationFrameScheduler;
    }
}

declare module "rx.dom" {
    export = Rx;
}

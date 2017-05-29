declare module Falcor {
    class Model {
        constructor(...args: any[]);
        get(...args: any[]): any;
        set(jsongEnv: any): any;
        treatErrorsAsValues(): any;
        call(callPath: any, args?: any, pathSuffix?: any, paths?: any): any;
        batch(milliseconds: number): Model;
        invalidate(...path: any[]): void;
    }
}

export = Falcor;

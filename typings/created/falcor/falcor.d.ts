declare module "falcor" {
    interface IModel {
        get(pathSet: any): any;
        set(jsongEnv: any): any;
        call(callPath: any, args?: any, pathSuffix?: any, paths?: any): any;
    }

    export class Model implements IModel {
        constructor(...args: any[]);
        get(...args: any[]): any;
        set(jsongEnv: any): any;
        treatErrorsAsValues(): any;
        call(callPath: any, args?: any, pathSuffix?: any, paths?: any): any;
        batch(milliseconds: number): Model;
        invalidate(...path: any[]): void;
    }

    export default Model;
}

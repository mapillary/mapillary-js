declare module "falcor" {
    interface IModel {
        get(pathSet: any): any;
        set(jsongEnv: any): any;
        call(callPath: any, args?: any, pathSuffix?: any, paths?: any): any;
    }
    export class Model implements IModel {
        constructor(...args: any[]);
        get(pathSet: any): any;
        set(jsongEnv: any): any;
        treatErrorsAsValues(): any;
        call(callPath: any, args?: any, pathSuffix?: any, paths?: any): any;
    }
    export default Model;
}

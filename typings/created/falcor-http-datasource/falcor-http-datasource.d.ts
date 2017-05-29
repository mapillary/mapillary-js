declare class HttpDataSource {
    constructor(...args: any[]);
    get(pathSet: any): any;
    set(jsongEnv: any): any;
    call(callPath: any, args?: any, pathSuffix?: any, paths?: any): any;
}

declare module HttpDataSource { }

export = HttpDataSource;

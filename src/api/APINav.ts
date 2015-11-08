import APIc from "./APIc";

/* interfaces */
import IAPINavIm from "./interfaces/IAPINavIm";

export class APINav extends APIc {
    public callNav(path: string): any {
        return this.callApi("nav/" + path);
    }

    public h(id: string): any {
        return this.callNav("h/" + id);
    }

    public parseH(response: any): IAPINavIm {
        return response;
    }

    public im(key: string): any {
        return this.callNav("im/" + key);
    }

    public parseIm(response: any): IAPINavIm {
        return response;
    }
}

export default APINav

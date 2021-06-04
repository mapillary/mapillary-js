export class XMLHTTPRequestMock {
    public response: {};
    public responseType: string;
    public status: number;
    public timeout: number;

    public onload: (e: Event) => any;
    public onerror: (e: Event) => any;
    public ontimeout: (e: Event) => any;
    public onabort: (e: Event) => any;

    public abort(): void { this.onabort(new Event("abort")); }
    public open(...args: any[]): void { return; }
    public send(...args: any[]): void { return; }
};

export class VCR {
    public static cache: any = {};

    public static setCache(cache: any): void {
        this.cache = cache;
    }

    public static get(tape: string, key: string): any {
        if (this.cache[tape] === undefined) {
            console.log("VCR: MISSING KEY " + key);
            return undefined;
        }

        return this.cache[tape][key];
    }

    public static set(tape: string, key: string, data: any): any {
        if (this.cache[tape] === undefined) {
            this.cache[tape] = {};
        }
        this.cache[tape][key] = data;
    }

    public static printInstructions(): void {
        console.log("RUN THE FOLLOWING");

        let call: string = "rm -rf vcr/vcr.json";
        call += this.tofi("echo \"{\"");

        for (var i in this.cache) {
            if (this.cache.hasOwnProperty(i)) {
                let first: boolean = true;
                call += this.tofi("echo \"\\\"" + i + "\\\": {\"");
                for (var k in this.cache[i]) {
                    if (this.cache[i].hasOwnProperty(k)) {
                        if (first) {
                            first = false;
                            call += this.tofi("echo \"\\\"" + k + "\\\": \"");
                        } else {
                            call += this.tofi("echo \", \\\"" + k + "\\\": \"");
                        }
                        call += this.tofi("curl " + k, true);
                    }
                }
                call += this.tofi("echo \"}\"");
            }
        }

        call += this.tofi("echo \"}\"");

        console.log(call);
    }

    private static tofi(cmd: string, clean: boolean = false): string {
        let filename: string = "vcr/vcr.json";

        if (clean) {
            cmd = cmd.replace("?", "\\?");
            cmd = cmd.replace("=", "\\=");
            cmd = cmd.replace("&", "\\&");
        }

        return " && " + cmd + " >> " + filename;
    }
}

export default VCR;

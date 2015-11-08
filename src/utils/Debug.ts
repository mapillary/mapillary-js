// fixme add more sophistication, this might be a module

enum LogLevel {debug, log, warning, error, off};

export class Debug {
    public static logLevel: LogLevel = LogLevel.off;

    public static debug(message: any): void {
        if (this.logLevel <= LogLevel.debug) {
            console.log(message);
        }
    }

    public static log(message: any): void {
        if (this.logLevel <= LogLevel.log) {
            console.log(message);
        }
    }

    public static warning(message: any): void {
        if (this.logLevel <= LogLevel.warning) {
            console.log(message);
        }
    }

    public static error(message: any): void {
        if (this.logLevel <= LogLevel.error) {
            console.log(message);
        }
    }
}

export default Debug

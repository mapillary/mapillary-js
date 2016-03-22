declare module "rbush" {
    module rbush {
        interface RBush {
            insert(a: any): void;
            remove(a: any): void;
            search(a: any): any;
            all(): any[];
            clear(): void;
        }
    }

    function rbush(n: number, a: any): rbush.RBush;

    export = rbush;
}
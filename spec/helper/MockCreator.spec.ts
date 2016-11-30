/// <reference path="../../typings/index.d.ts" />

export class MockCreator {
    public createMock<T>(ctor: new (...args: any[]) => T, name: string): T {
        let spy: { [key: string]: any } = {};

        for (let key in ctor.prototype) {
            if (!Object.getOwnPropertyDescriptor(ctor.prototype, key).get) {
                spy[key] = jasmine.createSpy(name + "." + key);
            }

        }

        return <T>spy;
    }
}

export default MockCreator;

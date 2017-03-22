/// <reference path="../../typings/index.d.ts" />

export class MockCreator {
    public createMock<T>(ctor: new (...args: any[]) => T, name: string): T {
        let spy: { [key: string]: any } = {};

        for (let key in ctor.prototype) {
            if (!!Object.getOwnPropertyDescriptor(ctor.prototype, key) &&
                !Object.getOwnPropertyDescriptor(ctor.prototype, key).get) {
                spy[key] = jasmine.createSpy(name + "." + key, ctor.prototype[key]);
            }
        }

        return <T>spy;
    }

    protected _mockProperty<T, U>(object: T, propertyName: string, propertyValue: U): void {
        Object.defineProperty(
            object,
            propertyName,
            {
                get: (): U => { return propertyValue; },
                set: (value: U): void => { propertyValue = value; },
            });
    }
}

export default MockCreator;

export class MockCreator {
    public create<T>(ctor: new (...args: any[]) => T, name: string): T {
        const spy: { [key: string]: any } = {};

        for (const key in ctor.prototype) {
            if (!!Object.getOwnPropertyDescriptor(ctor.prototype, key) &&
                !Object.getOwnPropertyDescriptor(ctor.prototype, key).get) {
                spy[key] = jasmine.createSpy(name + "." + key, ctor.prototype[key]);
            }
        }

        return <T>spy;
    }

    public mockProperty<T, U>(instance: T, propertyName: string, propertyValue: U): T {
        Object.defineProperty(
            instance,
            propertyName,
            {
                get: (): U => { return propertyValue; },
                set: (value: U): void => { propertyValue = value; },
            });

        return instance;
    }
}

export default MockCreator;

/// <reference path="../../typings/index.d.ts" />

export abstract class MockCreatorBase<T> {
    public abstract create(): T;

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

export default MockCreatorBase;

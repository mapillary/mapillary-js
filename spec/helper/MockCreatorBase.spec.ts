import { MockCreator } from "./MockCreator.spec";

export abstract class MockCreatorBase<T> {
    private _mockCreator: MockCreator = new MockCreator();

    public abstract create(): T;

    protected _mockProperty<U>(instance: T, propertyName: string, propertyValue: U): void {
        this._mockCreator.mockProperty(instance, propertyName, propertyValue);
    }
}

export default MockCreatorBase;

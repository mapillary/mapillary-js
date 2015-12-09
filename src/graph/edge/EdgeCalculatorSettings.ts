export class EdgeCalculatorSettings {

    public maxStepDistance: number;
    public maxStepDirectionChange: number;
    public maxStepDrift: number;
    public preferredStepDistance: number;

    constructor() {
        this.maxStepDistance = 20;
        this.maxStepDirectionChange = Math.PI / 6;
        this.maxStepDrift = Math.PI / 6;
        this.preferredStepDistance = 4;
    }

    public get maxDistance(): number {
        return this.maxStepDistance;
    }
}

export default EdgeCalculatorSettings;

export class EdgeCalculatorSettings {
    public maxDistance: number;

    public maxStepDirectionChange: number;
    public maxStepDrift: number;

    constructor() {
        this.maxDistance = 20;

        this.maxStepDirectionChange = Math.PI / 6;
        this.maxStepDrift = Math.PI / 6;
    }
}

export default EdgeCalculatorSettings;

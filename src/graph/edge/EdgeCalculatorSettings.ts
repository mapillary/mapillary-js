export class EdgeCalculatorSettings {

    public maxStepDistance: number;
    public maxStepDirectionChange: number;
    public maxStepDrift: number;
    public preferredStepDistance: number;

    public turnMaxDistance: number;
    public turnMaxDirectionChange: number;
    public turnMaxRigDistance: number;
    public turnMinRigDirectionChange: number;

    constructor() {
        this.maxStepDistance = 20;
        this.maxStepDirectionChange = Math.PI / 6;
        this.maxStepDrift = Math.PI / 6;
        this.preferredStepDistance = 4;

        this.turnMaxDistance = 15;
        this.turnMaxDirectionChange = 2 * Math.PI / 9;
        this.turnMaxRigDistance = 0.65;
        this.turnMinRigDirectionChange = Math.PI / 6;
    }

    public get maxDistance(): number {
        return Math.max(this.maxStepDistance, this.turnMaxDistance);
    }
}

export default EdgeCalculatorSettings;

export class EdgeCalculatorSettings {

    public stepMaxDistance: number;
    public stepMaxDirectionChange: number;
    public stepMaxDrift: number;
    public stepPreferredDistance: number;

    public turnMaxDistance: number;
    public turnMaxDirectionChange: number;
    public turnMaxRigDistance: number;
    public turnMinRigDirectionChange: number;

    constructor() {
        this.stepMaxDistance = 20;
        this.stepMaxDirectionChange = Math.PI / 6;
        this.stepMaxDrift = Math.PI / 6;
        this.stepPreferredDistance = 4;

        this.turnMaxDistance = 15;
        this.turnMaxDirectionChange = 2 * Math.PI / 9;
        this.turnMaxRigDistance = 0.65;
        this.turnMinRigDirectionChange = Math.PI / 6;
    }

    public get maxDistance(): number {
        return Math.max(this.stepMaxDistance, this.turnMaxDistance);
    }
}

export default EdgeCalculatorSettings;

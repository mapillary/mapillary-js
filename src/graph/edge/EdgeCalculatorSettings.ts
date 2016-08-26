export class EdgeCalculatorSettings {
    public panoMinDistance: number;
    public panoMaxDistance: number;
    public panoPreferredDistance: number;
    public panoMaxItems: number;
    public panoMaxStepTurnChange: number;

    public rotationMaxDistance: number;
    public rotationMaxDirectionChange: number;
    public rotationMaxVerticalDirectionChange: number;

    public similarMaxDirectionChange: number;
    public similarMaxDistance: number;
    public similarMinTimeDifference: number;

    public stepMaxDistance: number;
    public stepMaxDirectionChange: number;
    public stepMaxDrift: number;
    public stepPreferredDistance: number;

    public turnMaxDistance: number;
    public turnMaxDirectionChange: number;
    public turnMaxRigDistance: number;
    public turnMinRigDirectionChange: number;

    constructor() {
        this.panoMinDistance = 0.1;
        this.panoMaxDistance = 20;
        this.panoPreferredDistance = 5;
        this.panoMaxItems = 4;
        this.panoMaxStepTurnChange = Math.PI / 8;

        this.rotationMaxDistance = this.turnMaxRigDistance;
        this.rotationMaxDirectionChange = Math.PI / 6;
        this.rotationMaxVerticalDirectionChange = Math.PI / 8;

        this.similarMaxDirectionChange = Math.PI / 8;
        this.similarMaxDistance = 12;
        this.similarMinTimeDifference = 12 * 3600 * 1000;

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
        return Math.max(
            this.panoMaxDistance,
            this.similarMaxDistance,
            this.stepMaxDistance,
            this.turnMaxDistance);
    }
}

export default EdgeCalculatorSettings;

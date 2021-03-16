export class EdgeCalculatorSettings {
    public sphericalMinDistance: number;
    public sphericalMaxDistance: number;
    public sphericalPreferredDistance: number;
    public sphericalMaxItems: number;
    public sphericalMaxStepTurnChange: number;

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
        this.sphericalMinDistance = 0.1;
        this.sphericalMaxDistance = 20;
        this.sphericalPreferredDistance = 5;
        this.sphericalMaxItems = 4;
        this.sphericalMaxStepTurnChange = Math.PI / 8;

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
            this.sphericalMaxDistance,
            this.similarMaxDistance,
            this.stepMaxDistance,
            this.turnMaxDistance);
    }
}

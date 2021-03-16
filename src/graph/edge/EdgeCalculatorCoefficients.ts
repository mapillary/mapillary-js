export class EdgeCalculatorCoefficients {
    public sphericalPreferredDistance: number;
    public sphericalMotion: number;
    public sphericalSequencePenalty: number;
    public sphericalMergeCCPenalty: number;

    public stepPreferredDistance: number;
    public stepMotion: number;
    public stepRotation: number;
    public stepSequencePenalty: number;
    public stepMergeCCPenalty: number;

    public similarDistance: number;
    public similarRotation: number;

    public turnDistance: number;
    public turnMotion: number;
    public turnSequencePenalty: number;
    public turnMergeCCPenalty: number;

    constructor() {
        this.sphericalPreferredDistance = 2;
        this.sphericalMotion = 2;
        this.sphericalSequencePenalty = 1;
        this.sphericalMergeCCPenalty = 4;

        this.stepPreferredDistance = 4;
        this.stepMotion = 3;
        this.stepRotation = 4;
        this.stepSequencePenalty = 2;
        this.stepMergeCCPenalty = 6;

        this.similarDistance = 2;
        this.similarRotation = 3;

        this.turnDistance = 4;
        this.turnMotion = 2;
        this.turnSequencePenalty = 1;
        this.turnMergeCCPenalty = 4;
    }
}

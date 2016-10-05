export class EdgeCalculatorCoefficients {
    public panoPreferredDistance: number;
    public panoMotion: number;
    public panoSequencePenalty: number;
    public panoMergeCCPenalty: number;

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
        this.panoPreferredDistance = 2;
        this.panoMotion = 2;
        this.panoSequencePenalty = 1;
        this.panoMergeCCPenalty = 4;

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

export default EdgeCalculatorCoefficients;

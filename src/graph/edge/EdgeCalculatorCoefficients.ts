export class EdgeCalculatorCoefficients {

    public stepPreferredDistance: number;
    public stepMotion: number;
    public stepRotation: number;
    public stepSequencePenalty: number;
    public stepMergeCcPenalty: number;

    constructor() {
        this.stepPreferredDistance = 4;
        this.stepMotion = 3;
        this.stepRotation = 4;
        this.stepSequencePenalty = 2;
        this.stepMergeCcPenalty = 6;

    }
}

export default EdgeCalculatorCoefficients;

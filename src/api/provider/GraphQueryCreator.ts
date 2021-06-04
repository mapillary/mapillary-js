export class GraphQueryCreator {
    public readonly imagesPath: string;
    public readonly sequencePath: string;

    public readonly coreFields: string[];
    public readonly idFields: string[];
    public readonly spatialFields: string[];
    public readonly imageTileFields: string[];

    private readonly _imageTilesPath: string;

    constructor() {
        this.imagesPath = 'images';
        this.sequencePath = 'image_ids';
        this._imageTilesPath = 'tiles';

        this.coreFields = ['computed_geometry', 'geometry', 'sequence'];
        this.idFields = ['id'];
        this.spatialFields = [
            'altitude',
            'atomic_scale',
            'camera_parameters',
            'camera_type',
            'captured_at',
            'compass_angle',
            'computed_altitude',
            'computed_compass_angle',
            'computed_rotation',
            'exif_orientation',
            'height',
            'merge_cc',
            'mesh',
            'quality_score',
            'sfm_cluster',
            'thumb_1024_url',
            'thumb_2048_url',
            'width',
        ];
        this.imageTileFields = ['url', 'z', 'x', 'y'];
    }

    public images(imageIds: string[], fields: string[]): string {
        return `image_ids=${imageIds.join(',')}&fields=${fields.join(',')}`;
    }

    public imagesS2(cellId: string, fields: string[]): string {
        return `s2=${cellId}&fields=${fields.join(',')}`;
    }

    public imageTiles(z: number, fields: string[]): string {
        return `z=${z}&fields=${fields.join(',')}`;
    }

    public imageTilesPath(imageId: string): string {
        return `${imageId}/${this._imageTilesPath}`;
    }

    public sequence(sequenceId: string): string {
        return `sequence_id=${sequenceId}`;
    }
}

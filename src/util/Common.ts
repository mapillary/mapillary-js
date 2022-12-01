import { Image } from "../graph/Image";
import { CoreImageEnt } from "../api/ents/CoreImageEnt";
import { SpatialImageEnt } from "../api/ents/SpatialImageEnt";
import { DataProviderBase } from "../api/DataProviderBase";
import { MeshContract } from "../api/contracts/MeshContract";
import { S2GeometryProvider } from "../api/S2GeometryProvider";
import { ImageCache } from "../graph/ImageCache";
import { ICameraFactory } from "../geometry/interfaces/ICameraFactory";
import { PerspectiveCamera } from "../geometry/camera/PerspectiveCamera";
import { ICamera } from "../geometry/interfaces/ICamera";
import { Observable } from "rxjs";

const NULL_IMAGE_ID: string = 'null-image-id';

class NullCameraFactory implements ICameraFactory {
    public makeCamera(_type: string, _parameters: number[]): ICamera {
        return new PerspectiveCamera([0.85, 0, 0]);
    }
}

class NullImageDataProvider extends DataProviderBase {
    constructor() {
        super(new S2GeometryProvider());
    }

    public getImageBuffer(): Promise<ArrayBuffer> {
        return generateImageBuffer();
    }

    public getMesh(): Promise<MeshContract> {
        return Promise.resolve({ faces: [], vertices: [] });
    }
}

function generateImageBuffer(): Promise<ArrayBuffer> {
    const canvas = document.createElement('canvas');
    const w = 1;
    const h = 1;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = `rgb(0 0 0)`;
    ctx.fillRect(0, 0, w, h);

    return new Promise<ArrayBuffer>((resolve) => {
        canvas.toBlob(
            (blob) => {
                blob.arrayBuffer()
                    .then(buffer => resolve(buffer));
            },
            'image/jpeg',
            1,
        );
    });
}

export function isNullImageId(imageId: string): boolean {
    return imageId === NULL_IMAGE_ID;
}

export function makeNullImage$(): Observable<Image> {
    const core: CoreImageEnt = {
        computed_geometry: null,
        geometry: { lat: 90, lng: 0 },
        id: NULL_IMAGE_ID,
        sequence: {
            id: 'null-sequence-id',
        },
    };
    const image = new Image(core);
    const spatial: SpatialImageEnt = {
        altitude: 0,
        camera_parameters: [],
        camera_type: 'null-camera-type',
        captured_at: 0,
        cluster: { id: 'null-cluster-id', url: 'null-cluster-url' },
        compass_angle: 0,
        creator: { id: 'null-creator-id', username: 'null-creator-username' },
        exif_orientation: 0,
        height: 0,
        id: NULL_IMAGE_ID,
        mesh: { id: 'null-mesh-id', url: 'null-mesh-url' },
        owner: { id: 'null-owner-id' },
        thumb: { id: 'null-thumb-id', url: 'null-thumb-url' },
        width: 0,
        atomic_scale: 0,
        computed_altitude: 0,
        computed_compass_angle: 0,
        computed_rotation: [0, 0, 0],
        merge_id: 'null-merge-id',
        private: false,
        quality_score: 0,
    };
    image.makeComplete(spatial);
    image.initializeCache(new ImageCache(new NullImageDataProvider()));
    image.cacheSequenceEdges([]);
    image.cacheSpatialEdges([]);

    return image.cacheAssets$(new NullCameraFactory());
}

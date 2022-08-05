import {
    GraphCameraContract,
    GraphCameraShotContract,
    GraphClusterContract,
    GraphPointContract,
} from "../../../src/api/provider/GraphContracts";
import {
    convertCameraType,
    GraphConverter,
} from "../../../src/api/provider/GraphConverter";
import {
    GraphCoreImageEnt,
    GraphSpatialImageEnt,
} from "../../../src/api/provider/GraphEnts";

describe("convertCameraType", () => {
    test("should convert to supported types", () => {
        expect(convertCameraType("spherical")).toBe("spherical");
        expect(convertCameraType("equirectangular")).toBe("spherical");
        expect(convertCameraType("fisheye")).toBe("fisheye");
        expect(convertCameraType("perspective")).toBe("perspective");
        expect(convertCameraType("not-supported")).toBe("perspective");
    });
});

describe("GraphConverter.ctor", () => {
    test("should create a converter", () => {
        const converter = new GraphConverter();
        expect(converter).toBeDefined();
    });
});

describe("GraphConverter.clusterReconstruction", () => {
    test('cluster reconstruction', () => {
        const contract: GraphClusterContract = {
            cameras: {},
            points: {},
            reference_lla: { altitude: 1, latitude: 2, longitude: 3 },
            shots: {},
        };

        const camera: GraphCameraContract = {
            focal: 4,
            k1: 5,
            k2: 6,
            projection_type: 'spherical',
        };

        const color = [7, 8, 9];
        const coordinates = [10, 11, 12];
        const point: GraphPointContract = {
            color: color.slice(),
            coordinates: coordinates.slice(),
        };

        const cameraId = 'camera-id';
        const shot: GraphCameraShotContract = {
            camera: cameraId,
            rotation: [13, 14, 15],
            translation: [16, 17, 18],
        };

        contract.cameras[cameraId] = camera;
        const pointId = 'point-id';
        contract.points[pointId] = point;
        const shotId = 'shot-id';
        contract.shots[shotId] = shot;

        const converter = new GraphConverter();
        const cluster = converter.clusterReconstruction(contract);

        expect(cluster).toBeDefined();

        // Points
        expect(Object.keys(cluster.pointIds).length).toBe(1);

        const index = cluster.pointIds.indexOf(pointId);
        expect(index).toBeGreaterThanOrEqual(0);

        const pointIndex = 3 * index;

        expect(cluster.colors[pointIndex + 0]).toBeCloseTo(color[0] / 255);
        expect(cluster.colors[pointIndex + 1]).toBeCloseTo(color[1] / 255);
        expect(cluster.colors[pointIndex + 2]).toBeCloseTo(color[2] / 255);

        expect(cluster.coordinates[pointIndex + 0]).toBeCloseTo(coordinates[0]);
        expect(cluster.coordinates[pointIndex + 1]).toBeCloseTo(coordinates[1]);
        expect(cluster.coordinates[pointIndex + 2]).toBeCloseTo(coordinates[2]);

        // Reference
        expect(cluster.reference).toBeDefined();
        expect(cluster.reference.alt).toBe(contract.reference_lla.altitude);
        expect(cluster.reference.lat).toBe(contract.reference_lla.latitude);
        expect(cluster.reference.lng).toBe(contract.reference_lla.longitude);

        // Rotation
        expect(cluster.rotation).toBeDefined();
        expect(cluster.rotation.length).toBe(3);
        expect(cluster.rotation[0]).toBe(0);
        expect(cluster.rotation[1]).toBe(0);
        expect(cluster.rotation[2]).toBe(0);
    });
});


describe("GraphConverter.coreImage", () => {
    test('core image', () => {
        const imageId = 'image-id';
        const sequenceId = 'sequence-id';
        const ent: GraphCoreImageEnt = {
            computed_geometry: { coordinates: [0, 1] },
            geometry: { coordinates: [2, 3] },
            id: imageId,
            sequence: sequenceId,
        };

        const converter = new GraphConverter();
        const image = converter.coreImage(ent);

        expect(image.computed_geometry.lng).toBe(0);
        expect(image.computed_geometry.lat).toBe(1);
        expect(image.geometry.lng).toBe(2);
        expect(image.geometry.lat).toBe(3);
        expect(image.id).toBe(imageId);
        expect(image.sequence.id).toBe(sequenceId);
    });

    test('core image fallbacks', () => {
        const imageId = 'image-id';
        const ent: GraphCoreImageEnt = {
            computed_geometry: { coordinates: [0, 1] },
            geometry: { coordinates: [2, 3] },
            id: imageId,
            sequence: null,
        };

        const converter = new GraphConverter();
        const image = converter.coreImage(ent);

        expect(image.sequence).toBeDefined();
        expect(image.sequence.id).toBeNull();
    });
});

describe("GraphConverter.spatialImage", () => {
    test('spatial image', () => {
        const ent: GraphSpatialImageEnt = {
            altitude: 32,
            atomic_scale: 0.2,
            camera_parameters: [2, 3, 4],
            camera_type: 'perspective',
            captured_at: 32,
            cluster: null,
            compass_angle: 122,
            computed_altitude: 1e3,
            computed_compass_angle: 133,
            computed_rotation: [0.2, 0.3, 0.4],
            creator: { id: 'user-id', username: 'user-name' },
            exif_orientation: 8,
            height: 3000,
            id: 'image-id',
            merge_cc: 7,
            mesh: { id: 'mesh-id', url: 'mesh-url' },
            owner: { id: 'owner-id' },
            quality_score: 0.8,
            sfm_cluster: { id: 'cluster-id', url: 'cluster-url' },
            thumb: null,
            thumb_1024_url: '1024',
            thumb_2048_url: '2048',
            width: 4000,
        };

        const converter = new GraphConverter();
        const image = converter.spatialImage(ent);

        expect(image.altitude).toBe(ent.altitude);
        expect(image.atomic_scale).toBe(ent.atomic_scale);
        expect(image.camera_parameters[0]).toEqual(ent.camera_parameters[0]);
        expect(image.camera_parameters[1]).toEqual(ent.camera_parameters[1]);
        expect(image.camera_parameters[2]).toEqual(ent.camera_parameters[2]);
        expect(image.camera_type).toBe(ent.camera_type);
        expect(image.captured_at).toBe(ent.captured_at);
        expect(image.cluster.id).toBe(ent.sfm_cluster.id);
        expect(image.cluster.url).toBe(ent.sfm_cluster.url);
        expect(image.compass_angle).toBe(ent.compass_angle);
        expect(image.computed_altitude).toBe(ent.computed_altitude);
        expect(image.computed_compass_angle).toBe(ent.computed_compass_angle);
        expect(image.computed_rotation).toEqual(ent.computed_rotation);
        expect(image.creator.id).toBe(ent.creator.id);
        expect(image.creator.username).toBe(ent.creator.username);
        expect(image.exif_orientation).toBe(ent.exif_orientation);
        expect(image.height).toBe(ent.height);
        expect(image.id).toBe(ent.id);
        expect(image.merge_id).toBe(ent.merge_cc.toString());
        expect(image.mesh.url).toBe(ent.mesh.url);
        expect(image.owner.id).toBe(ent.owner.id);
        expect(image.quality_score).toBe(ent.quality_score);
        expect(image.thumb.url).toBe(ent.thumb_1024_url);
        expect(image.width).toBe(ent.width);
        expect(image.private).toBeNull();
    });

    test('spatial image fallbacks', () => {
        const ent: GraphSpatialImageEnt = {
            altitude: 32,
            atomic_scale: 0.2,
            camera_parameters: [2, 3, 4],
            camera_type: 'perspective',
            captured_at: 32,
            cluster: null,
            compass_angle: 122,
            computed_altitude: 1e3,
            computed_compass_angle: 133,
            computed_rotation: [0.2, 0.3, 0.4],
            creator: null,
            exif_orientation: 8,
            height: 3000,
            id: 'image-id',
            merge_cc: 7,
            mesh: null,
            owner: null,
            quality_score: 0.8,
            sfm_cluster: null,
            thumb: null,
            thumb_1024_url: null,
            thumb_2048_url: null,
            width: 4000,
        };

        const converter = new GraphConverter();
        const image = converter.spatialImage(ent);

        expect(image.cluster).toBeDefined();
        expect(image.cluster.id).toBeNull();
        expect(image.cluster.url).toBeNull();

        expect(image.creator).toBeDefined();
        expect(image.creator.id).toBeNull();
        expect(image.creator.username).toBeNull();

        expect(image.mesh).toBeDefined();
        expect(image.mesh.id).toBeNull();
        expect(image.mesh.url).toBeNull();

        expect(image.owner).toBeDefined();
        expect(image.owner.id).toBeNull();

        expect(image.thumb).toBeDefined();
        expect(image.thumb.id).toBeNull();
        expect(image.thumb.url).toBeNull();

        expect(image.private).toBeNull();
    });
});

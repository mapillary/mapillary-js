import { CameraType } from "../../src/geo/interfaces/CameraType";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { ImageEnt } from "../../src/api/ents/ImageEnt";
import { Image } from "../../src/graph/Image";

export class ImageHelper {
    private _clusterId: string = "clid";
    private _imageId: string = "iid";
    private _sequenceId: string = "sid";
    private _creatorId: string = "crid";
    private _creatorUsername: string = "cname";

    public createCoreImageEnt(): CoreImageEnt {
        return {
            computed_geometry: { lat: 0, lng: 0 },
            id: this._imageId,
            geometry: { lat: 0, lng: 0 },
            sequence: { id: this._sequenceId },
        };
    }

    public createSpatialImageEnt(): SpatialImageEnt {
        return {
            altitude: 0,
            atomic_scale: 0,
            camera_parameters: [1, 0, 0],
            camera_type: "perspective",
            captured_at: 0,
            computed_rotation: [0, 0, 0],
            compass_angle: 0,
            computed_altitude: 0,
            computed_compass_angle: 0,
            cluster: {
                id: this._clusterId,
                url: this._clusterId + "_url",
            },
            creator: { id: this._creatorId, username: this._creatorUsername },
            exif_orientation: 0,
            height: 1,
            id: "id",
            merge_cc: 0,
            mesh: { id: "mesh-id", url: "mesh-url" },
            owner: { id: null },
            private: false,
            thumb: { id: "thumb-id", url: "thumb-url" },
            width: 1,
        };
    }

    public createImageEnt(): ImageEnt {
        return {
            altitude: 0,
            atomic_scale: 0,
            computed_rotation: [0, 0, 0],
            compass_angle: 0,
            computed_altitude: 0,
            camera_parameters: [1, 0, 0],
            camera_type: "perspective",
            captured_at: 0,
            computed_compass_angle: 0,
            computed_geometry: { lat: 0, lng: 0 },
            cluster: {
                id: this._clusterId,
                url: this._clusterId + "_url",
            },
            creator: { id: this._creatorId, username: this._creatorUsername },
            exif_orientation: 0,
            geometry: { lat: 0, lng: 0 },
            height: 1,
            id: this._imageId,
            merge_cc: 1,
            mesh: { id: "mesh-id", url: "mesh-url" },
            owner: { id: null },
            private: false,
            sequence: { id: this._sequenceId },
            thumb: { id: "thumb-id", url: "thumb-url" },
            width: 1,
        };
    }

    public createImage(cameraType: CameraType = "perspective"): Image {
        const imageEnt = this.createImageEnt();
        imageEnt.camera_type = cameraType;
        const image = new Image(imageEnt);
        image.makeComplete(imageEnt);
        return image;
    }

    public createUnmergedImage(): Image {
        const imageEnt: ImageEnt = this.createImageEnt();

        imageEnt.atomic_scale = undefined;
        imageEnt.compass_angle = undefined;
        imageEnt.computed_altitude = undefined;
        imageEnt.camera_parameters = undefined;
        imageEnt.camera_type = undefined;
        imageEnt.computed_geometry = undefined;
        imageEnt.merge_cc = undefined;

        const image: Image = new Image(imageEnt);
        image.makeComplete(imageEnt);
        return image;
    }
}

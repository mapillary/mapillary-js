import { Image } from "./Image";

// Operator
export type ComparisonFilterOperator =
    | "=="
    | "!="
    | ">"
    | ">="
    | "<"
    | "<=";

export type SetMembershipFilterOperator =
    | "in"
    | "!in";

export type CombiningFilterOperator =
    | "all";

export type FilterOperator =
    | CombiningFilterOperator
    | ComparisonFilterOperator
    | SetMembershipFilterOperator;

// Key
export type FilterImage = Pick<
    Image,
    | "cameraType"
    | "capturedAt"
    | "clusterId"
    | "creatorId"
    | "creatorUsername"
    | "exifOrientation"
    | "height"
    | "id"
    | "mergeId"
    | "merged"
    | "ownerId"
    | "private"
    | "qualityScore"
    | "sequenceId"
    | "width"
>;

export type FilterKey = keyof FilterImage;

// Value
export type FilterValue = boolean | number | string;

// Operation
export type ComparisonFilterExpression =
    [ComparisonFilterOperator, FilterKey, FilterValue];

export type SetMembershipFilterExpression =
    [SetMembershipFilterOperator, FilterKey, ...FilterValue[]];

export type CombiningFilterExpression = [
    CombiningFilterOperator,
    ...(
        | ComparisonFilterExpression
        | SetMembershipFilterExpression
    )[]
];

export type FilterExpression =
    | ComparisonFilterExpression
    | SetMembershipFilterExpression
    | CombiningFilterExpression;

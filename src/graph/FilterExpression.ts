export type FilterExpression = (FilterOperator | string | FilterValue | FilterOperation)[];

export type FilterOperation = [FilterOperator, string, FilterValue];

export type FilterOperator =
    "==" |
    "!=" |
    ">" |
    ">=" |
    "<" |
    "<=" |
    "in" |
    "!in" |
    "all";

export type FilterValue = boolean | number | string;

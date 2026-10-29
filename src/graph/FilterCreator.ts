import { Image } from "./Image";
import {
    FilterExpression,
    FilterKey,
} from "./FilterExpression";

import { Func } from "../util/Func";

export type FilterFunction = Func<Image, boolean>;

/**
 * @class Filter
 *
 * @classdesc Represents a class for creating image filters. Implementation and
 * definitions based on https://github.com/mapbox/feature-filter.
 */
export class FilterCreator {
    /**
     * Create a filter from a filter expression.
     *
     * @description The following filters are supported:
     *
     * Comparison
     * `==`
     * `!=`
     * `<`
     * `<=`
     * `>`
     * `>=`
     *
     * Set membership
     * `in`
     * `!in`
     *
     * Combining
     * `all`
     *
     * @param {FilterExpression} filter - Comparison, set membership or combinding filter
     * expression.
     * @returns {FilterFunction} Function taking a image and returning a boolean that
     * indicates whether the image passed the test or not.
     */
    public createFilter(filter: FilterExpression): FilterFunction {
        if (filter == null || filter.length <= 1) {
            return () => true;
        }

        switch (filter[0]) {
            case "==":
                return this._compileComparisonOp((a, b) => a === b, filter[1], filter[2], false);
            case "!=":
                return this._compileComparisonOp((a, b) => a !== b, filter[1], filter[2], false);
            case ">":
                return this._compileComparisonOp((a, b) => a > b, filter[1], filter[2], true);
            case ">=":
                return this._compileComparisonOp((a, b) => a >= b, filter[1], filter[2], true);
            case "<":
                return this._compileComparisonOp((a, b) => a < b, filter[1], filter[2], true);
            case "<=":
                return this._compileComparisonOp((a, b) => a <= b, filter[1], filter[2], true);
            case "in": {
                const [, property, ...values] = filter;
                return this._compileInOp(property, values);
            }
            case "!in": {
                const [, property, ...values] = filter;
                return this._compileNegation(this._compileInOp(property, values));
            }
            case "all": {
                const [, ...filters] = filter;
                return this._compileLogicalOpAnd(filters);
            }
            default:
                // tslint:disable-next-line:no-unused-expression
                filter satisfies never; // exhaustivity check
                return () => true;
        }
    }

    private _compileComparisonOp<T>(
        operator: (a: T | null, b: T | null) => boolean,
        property: FilterKey,
        right: T,
        checkType: boolean,
    ): FilterFunction {
        const normalizedRight: T | null = this._normalizeValue(right);
        return (x: Image): boolean => {
            const left: T = <T>x[property];
            return (checkType ? typeof left === typeof normalizedRight : true) && operator(left, normalizedRight);
        };
    }

    private _compileInOp<T>(property: FilterKey, values: T[]): FilterFunction {
        const normalizedValues: Set<T | null> = new Set(values.map((value: T): T | null => this._normalizeValue(value)));
        return (x: Image): boolean => normalizedValues.has(<T>x[property]);
    }

    private _compileLogicalOpAnd(
        filters: FilterExpression[],
    ): FilterFunction {
        const functions = filters.map(filter => this.createFilter(filter));
        return x => functions.every(f => f(x));
    }

    private _compileNegation(f: FilterFunction): FilterFunction {
        return (x) => !f(x);
    }

    private _normalizeValue<T>(value: T): T | null {
        return typeof value === "number" && !Number.isFinite(value) ? null : value;
    }
}

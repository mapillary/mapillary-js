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
                return this._compileInOp(property, new Set(values));
            }
            case "!in": {
                const [, property, ...values] = filter;
                return this._compileNegation(this._compileInOp(property, new Set(values)));
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
        operator: (a: T, b: T) => boolean,
        property: FilterKey,
        right: T,
        checkType: boolean,
    ): FilterFunction {
        return x => {
            const left = <T>x[property];
            return (checkType ? typeof left === typeof right : true) && operator(left, right)
        };
    }

    private _compileInOp<T>(property: FilterKey, values: Set<T>): FilterFunction {
        return (x) => values.has(<T>x[property]);
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
}

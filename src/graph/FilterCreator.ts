import {
    FilterExpression,
    FilterOperation,
    FilterOperator,
    FilterValue,
    Node,
} from "../Graph";
import {Func} from "../Utils";

export type FilterFunction = Func<Node, boolean>;

/**
 * @class Filter
 *
 * @classdesc Represents a class for creating node filters. Implementation and
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
     * @returns {FilterFunction} Function taking a node and returning a boolean that
     * indicates whether the node passed the test or not.
     */
    public createFilter(filter: FilterExpression): FilterFunction {
        return <FilterFunction>new Function("node", "return " + this._compile(filter) + ";");
    }

    private _compile(filter: FilterExpression): string {
        if (filter == null || filter.length <= 1) {
            return "true";
        }

        const operator: FilterOperator = <FilterOperator>filter[0];
        const operation: string =
            operator === "==" ? this._compileComparisonOp("===", <string>filter[1], filter[2], false) :
            operator === "!=" ? this._compileComparisonOp("!==", <string>filter[1], filter[2], false) :
            operator === ">" ||
            operator === ">=" ||
            operator === "<" ||
            operator === "<=" ? this._compileComparisonOp(operator, <string>filter[1], filter[2], true) :
            operator === "in" ?
                this._compileInOp<FilterValue>(<string>filter[1], <FilterValue[]>filter.slice(2)) :
            operator === "!in" ?
                this._compileNegation(
                    this._compileInOp<FilterValue>(<string>filter[1], <FilterValue[]>filter.slice(2))) :
            operator === "all" ? this._compileLogicalOp(<FilterOperation[]>filter.slice(1), "&&") :
            "true";

        return "(" + operation + ")";
    }

    private _compare<T>(a: T, b: T): number {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    private _compileComparisonOp<T>(operator: string, property: string, value: T, checkType: boolean): string {
        const left: string = this._compilePropertyReference(property);
        const right: string = JSON.stringify(value);

        return (checkType ? "typeof " + left + "===typeof " + right + "&&" : "") + left + operator + right;
    }

    private _compileInOp<T>(property: string, values: T[]): string {
        const compare: (a: T, b: T) => number = this._compare;
        const left: string = JSON.stringify(values.sort(compare));
        const right: string = this._compilePropertyReference(property);

        return left + ".indexOf(" + right + ")!==-1";
    }

    private _compileLogicalOp(filters: FilterOperation[], operator: string): string {
        const compile: (filter: FilterExpression) => string = this._compile.bind(this);

        return filters.map<string>(compile).join(operator);
    }

    private _compileNegation(expression: string): string {
        return "!(" + expression + ")";
    }

    private _compilePropertyReference(property: string): string {
        return "node[" + JSON.stringify(property) + "]";
    }
}

export default FilterCreator;

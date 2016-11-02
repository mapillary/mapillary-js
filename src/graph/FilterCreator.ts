import {Node} from "../Graph";
import {Func} from "../Utils";

export type FilterArrayValue =
    boolean[] |
    number[] |
    string[];

export type FilterDefinition = Array<FilterOperator | string | FilterValue | FilterArrayValue>;

export type FilterFunction = Func<Node, boolean>;

export type FilterOperator =
    "==" |
    "!=" |
    ">" |
    ">=" |
    "<" |
    "<=" |
    "in" |
    "!in";

export type FilterValue =
    boolean |
    number |
    string;

/**
 * @class Filter
 *
 * @classdesc Represents a class for creating node filters. Implementation and
 * definitions based on https://github.com/mapbox/feature-filter.
 */
export class FilterCreator {
    public createFilter(filter: FilterDefinition): FilterFunction {
        return <FilterFunction>new Function("node", "return " + this._compile(filter) + ";");
    }

    private _compile(filter: FilterDefinition): string {
        const operator: FilterOperator = <FilterOperator>filter[0];
        const operation: string =
            operator === "==" ? this._compileComparisonOperation("===", <string>filter[1], filter[2], false) :
            operator === "!=" ? this._compileComparisonOperation("!==", <string>filter[1], filter[2], false) :
            operator === ">" ||
            operator === ">=" ||
            operator === "<" ||
            operator === "<=" ? this._compileComparisonOperation(operator, <string>filter[1], filter[2], true) :
            operator === "in" ?
                this._compileInOperation<FilterValue>(<string>filter[1], <FilterArrayValue>filter.slice(2)) :
            operator === "!in" ?
                this._compileNegation(
                    this._compileInOperation<FilterValue>(<string>filter[1], <FilterArrayValue>filter.slice(2))) :
            "true";

        return "(" + operation + ")";
    }

    private _compare<T>(a: T, b: T): number {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    private _compileComparisonOperation<T>(operator: string, property: string, value: T, checkType: boolean): string {
        const left: string = this._compilePropertyReference(property);
        const right: string = JSON.stringify(value);

        return (checkType ? "typeof " + left + "===typeof " + right + "&&" : "") + left + operator + right;
    }

    private _compileInOperation<T>(property: string, values: T[]): string {
        const compare: (a: T, b: T) => number = this._compare;
        const left: string = JSON.stringify(values.sort(compare));
        const right: string = this._compilePropertyReference(property);

        return left + ".indexOf(" + right + ")!==-1";
    }

    private _compileNegation(expression: string): string {
        return "!(" + expression + ")";
    }

    private _compilePropertyReference(property: string): string {
        return "node[" + JSON.stringify(property) + "]";
    }
}

export default FilterCreator;

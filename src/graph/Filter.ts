import {Node} from "../Graph";
import {Func} from "../Utils";

export type ComparisonFilter<T> = [ComparisonOperator, FilterProperty, T];

export type ComparisonOperator =
    "==" |
    "!=" |
    ">" |
    ">=" |
    "<" |
    "<=";

export type FilterFunction = Func<Node, boolean>;

export type FilterProperty =
    "capturedAt" |
    "sequenceKey" |
    "userKey" |
    "username";

/**
 * @class Filter
 *
 * @classdesc Represents a class for creating node filters.
 */
export class Filter {
    public createComparisonFilter<T>(filter: ComparisonFilter<T>): FilterFunction {
        const operator: ComparisonOperator = filter[0];

        const str: string =
            operator === "==" ? this._compileComparisonOperation("===", filter[1], filter[2], false) :
            operator === "!=" ? this._compileComparisonOperation("!==", filter[1], filter[2], false) :
            operator === ">" ||
            operator === ">=" ||
            operator === "<" ||
            operator === "<=" ? this._compileComparisonOperation(operator, filter[1], filter[2], true) :
            "true";

        return <FilterFunction>new Function("node", "return (" + str + ");");
    }

    private _compileComparisonOperation<T>(operator: string, property: FilterProperty, value: T, checkType: boolean): string {
        const left: string = this._compilePropertyReference(property);
        const right: string = JSON.stringify(value);

        return (checkType ? "typeof " + left + "===typeof " + right + "&&" : "") + left + operator + right;
    }

    private _compilePropertyReference(property: FilterProperty): string {
        return "node[" + JSON.stringify(property) + "]";
    }
}

export default Filter;

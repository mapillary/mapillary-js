export class DOM {
    private _document: HTMLDocument;

    constructor(doc?: Node) {
        this._document = !!doc ? <HTMLDocument>doc : document;
    }

    public get document(): HTMLDocument {
        return this._document;
    }

    public createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K, className?: string, container?: HTMLElement): HTMLElementTagNameMap[K] {
        const element: HTMLElementTagNameMap[K] = this._document.createElement(tagName);

        if (!!className) {
            element.className = className;
        }

        if (!!container) {
            container.appendChild(element);
        }

        return element;
    }
}

export default DOM;

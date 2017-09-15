export class DOM {
    public createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K, className?: string, container?: HTMLElement): HTMLElementTagNameMap[K] {
        const element: HTMLElement = document.createElement(tagName);

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

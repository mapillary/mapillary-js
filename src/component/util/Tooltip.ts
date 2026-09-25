import * as vd from "virtual-dom";

export function createTooltipProperties(
    text: string,
    properties: vd.createProperties = {},
    position?: "left"): vd.createProperties {

    const onPointerDown: (event: PointerEvent) => void = properties.onpointerdown;
    const onPointerLeave: (event: PointerEvent) => void = properties.onpointerleave;
    const attributes: { [key: string]: string } = {
        ...properties.attributes,
        "data-mapillary-tooltip": text,
    };

    if (position) {
        attributes["data-mapillary-tooltip-position"] = position;
    }

    return {
        ...properties,
        attributes,
        onpointerdown: (event: PointerEvent): void => {
            (event.currentTarget as HTMLElement).setAttribute("data-mapillary-tooltip-dismissed", "");
            if (onPointerDown) {
                onPointerDown(event);
            }
        },
        onpointerleave: (event: PointerEvent): void => {
            (event.currentTarget as HTMLElement).removeAttribute("data-mapillary-tooltip-dismissed");
            if (onPointerLeave) {
                onPointerLeave(event);
            }
        },
    };
}

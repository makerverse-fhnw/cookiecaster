import * as d3 from "d3";

/**
 * @author Claudio
 * @date 29.04.2018
 * @version 1.0
 */

export default class AbstractMode {
    constructor() {
        if (this.constructor === AbstractMode) throw new Error("BaseMode is abstract class");
    }
    enableButtons(values) {
        for (let key in values) {
            if (Object.prototype.hasOwnProperty.call(values, key)) {
                d3.select(`#${key}`).classed("disable-mode", !values[key]);
            }
        }
    }
    enable() {}
    onMouseDown() {}
    onMouseMove() {}
    onMouseUp() {}
    onEscape() {}
    disable() {}
}
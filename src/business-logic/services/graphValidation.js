import * as d3 from "d3";

/**
 * Validates the graph and returns a structured result.
 * UI decides how to display messages (no window alerts here).
 */
export function validateGraph(graph, svgHandler, formatMessage, messages) {
    svgHandler.clearWarnings();
    const data = graph.validate();
    let errors = [];
    let warnings = [];

    data.valid = false;

    // ---- Forms validation ----
    const { forms, intersections } = data;

    if (forms.length === 0) {
        errors.push(formatMessage(messages.empty));
    } else {
        if (forms.length > 2) {
            errors.push(formatMessage(messages.morethan2forms));
        } else if (forms.length === 1) {
            if (!forms[0].closed) warnings.push(formatMessage(messages.open1));
        } else {
            const [form0, form1] = forms;
            const bothClosed = form0.closed && form1.closed;
            if (!bothClosed) {
                warnings.push(formatMessage(messages.open2));
            } else {
                const inside = (p, poly) => d3.polygonContains(poly, p);
                const f0 = form0.meta;
                const f1 = form1.meta;

                // Determine which one is outer (if any)
                if (f0.width < f1.width && f0.height < f1.height) {
                    if (inside([f0.center.x, f0.center.y], form1.points)) data.outer = 1;
                    else errors.push(formatMessage(messages.concentric));
                } else if (f0.width > f1.width && f0.height > f1.height) {
                    if (inside([f1.center.x, f1.center.y], form0.points)) data.outer = 0;
                    else errors.push(formatMessage(messages.concentric));
                } else {
                    errors.push(formatMessage(messages.concentric));
                }
            }
        }
    }

    // ---- Intersection warnings ----
    if (intersections.length > 0) {
        svgHandler.setIntersections(intersections);
        warnings.push(formatMessage(messages.validate));
    }

    // Set final validity
    data.valid = errors.length === 0;

    return {
        ...data,
        errors,
        warnings,
    };
}
export function meshToBinarySTL(mesh) {
    const facetCount = mesh.facets.length;
    const buffer = new ArrayBuffer(84 + facetCount * 50);
    const view = new DataView(buffer);

    // 80-byte header (ignored by slicers)
    for (let i = 0; i < 80; i++) {
        view.setUint8(i, 0);
    }

    // facet count
    view.setUint32(80, facetCount, true);

    let offset = 84;

    for (const facet of mesh.facets) {
        const n = facet.normal || [0, 0, 0];
        view.setFloat32(offset,     n[0], true);
        view.setFloat32(offset + 4, n[1], true);
        view.setFloat32(offset + 8, n[2], true);

        offset += 12;

        for (const v of facet.verts) {
            view.setFloat32(offset,     v[0], true);
            view.setFloat32(offset + 4, v[1], true);
            view.setFloat32(offset + 8, v[2], true);
            offset += 12;
        }

        // attribute byte count
        view.setUint16(offset, 0, true);
        offset += 2;
    }

    return new Blob([buffer], { type: "application/octet-stream" });
}

export function downloadBinaryStl(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
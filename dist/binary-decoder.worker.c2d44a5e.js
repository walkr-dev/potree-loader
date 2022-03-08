var $bb2f6760763a0914$export$718faa7d6d01aabc;
(function($bb2f6760763a0914$export$718faa7d6d01aabc) {
    $bb2f6760763a0914$export$718faa7d6d01aabc[$bb2f6760763a0914$export$718faa7d6d01aabc["POSITION_CARTESIAN"] = 0] = "POSITION_CARTESIAN";
    $bb2f6760763a0914$export$718faa7d6d01aabc[$bb2f6760763a0914$export$718faa7d6d01aabc["COLOR_PACKED"] = 1] = "COLOR_PACKED";
    $bb2f6760763a0914$export$718faa7d6d01aabc[$bb2f6760763a0914$export$718faa7d6d01aabc["COLOR_FLOATS_1"] = 2] = "COLOR_FLOATS_1";
    $bb2f6760763a0914$export$718faa7d6d01aabc[$bb2f6760763a0914$export$718faa7d6d01aabc["COLOR_FLOATS_255"] = 3] = "COLOR_FLOATS_255";
    $bb2f6760763a0914$export$718faa7d6d01aabc[$bb2f6760763a0914$export$718faa7d6d01aabc["NORMAL_FLOATS"] = 4] = "NORMAL_FLOATS";
    $bb2f6760763a0914$export$718faa7d6d01aabc[$bb2f6760763a0914$export$718faa7d6d01aabc["FILLER"] = 5] = "FILLER";
    $bb2f6760763a0914$export$718faa7d6d01aabc[$bb2f6760763a0914$export$718faa7d6d01aabc["INTENSITY"] = 6] = "INTENSITY";
    $bb2f6760763a0914$export$718faa7d6d01aabc[$bb2f6760763a0914$export$718faa7d6d01aabc["CLASSIFICATION"] = 7] = "CLASSIFICATION";
    $bb2f6760763a0914$export$718faa7d6d01aabc[$bb2f6760763a0914$export$718faa7d6d01aabc["NORMAL_SPHEREMAPPED"] = 8] = "NORMAL_SPHEREMAPPED";
    $bb2f6760763a0914$export$718faa7d6d01aabc[$bb2f6760763a0914$export$718faa7d6d01aabc["NORMAL_OCT16"] = 9] = "NORMAL_OCT16";
    $bb2f6760763a0914$export$718faa7d6d01aabc[$bb2f6760763a0914$export$718faa7d6d01aabc["NORMAL"] = 10] = "NORMAL";
})($bb2f6760763a0914$export$718faa7d6d01aabc || ($bb2f6760763a0914$export$718faa7d6d01aabc = {
}));
const $bb2f6760763a0914$export$f447a8ca794d62f1 = {
    DATA_TYPE_DOUBLE: {
        ordinal: 0,
        size: 8
    },
    DATA_TYPE_FLOAT: {
        ordinal: 1,
        size: 4
    },
    DATA_TYPE_INT8: {
        ordinal: 2,
        size: 1
    },
    DATA_TYPE_UINT8: {
        ordinal: 3,
        size: 1
    },
    DATA_TYPE_INT16: {
        ordinal: 4,
        size: 2
    },
    DATA_TYPE_UINT16: {
        ordinal: 5,
        size: 2
    },
    DATA_TYPE_INT32: {
        ordinal: 6,
        size: 4
    },
    DATA_TYPE_UINT32: {
        ordinal: 7,
        size: 4
    },
    DATA_TYPE_INT64: {
        ordinal: 8,
        size: 8
    },
    DATA_TYPE_UINT64: {
        ordinal: 9,
        size: 8
    }
};
function $bb2f6760763a0914$var$makePointAttribute(name, type, numElements) {
    return {
        name: name,
        type: type,
        numElements: numElements,
        byteSize: numElements * type.size
    };
}
const $bb2f6760763a0914$var$RGBA_PACKED = $bb2f6760763a0914$var$makePointAttribute($bb2f6760763a0914$export$718faa7d6d01aabc.COLOR_PACKED, $bb2f6760763a0914$export$f447a8ca794d62f1.DATA_TYPE_INT8, 4);
const $bb2f6760763a0914$export$c9c943992b7ca9cc = {
    POSITION_CARTESIAN: $bb2f6760763a0914$var$makePointAttribute($bb2f6760763a0914$export$718faa7d6d01aabc.POSITION_CARTESIAN, $bb2f6760763a0914$export$f447a8ca794d62f1.DATA_TYPE_FLOAT, 3),
    RGBA_PACKED: $bb2f6760763a0914$var$RGBA_PACKED,
    COLOR_PACKED: $bb2f6760763a0914$var$RGBA_PACKED,
    RGB_PACKED: $bb2f6760763a0914$var$makePointAttribute($bb2f6760763a0914$export$718faa7d6d01aabc.COLOR_PACKED, $bb2f6760763a0914$export$f447a8ca794d62f1.DATA_TYPE_INT8, 3),
    NORMAL_FLOATS: $bb2f6760763a0914$var$makePointAttribute($bb2f6760763a0914$export$718faa7d6d01aabc.NORMAL_FLOATS, $bb2f6760763a0914$export$f447a8ca794d62f1.DATA_TYPE_FLOAT, 3),
    FILLER_1B: $bb2f6760763a0914$var$makePointAttribute($bb2f6760763a0914$export$718faa7d6d01aabc.FILLER, $bb2f6760763a0914$export$f447a8ca794d62f1.DATA_TYPE_UINT8, 1),
    INTENSITY: $bb2f6760763a0914$var$makePointAttribute($bb2f6760763a0914$export$718faa7d6d01aabc.INTENSITY, $bb2f6760763a0914$export$f447a8ca794d62f1.DATA_TYPE_UINT16, 1),
    CLASSIFICATION: $bb2f6760763a0914$var$makePointAttribute($bb2f6760763a0914$export$718faa7d6d01aabc.CLASSIFICATION, $bb2f6760763a0914$export$f447a8ca794d62f1.DATA_TYPE_UINT8, 1),
    NORMAL_SPHEREMAPPED: $bb2f6760763a0914$var$makePointAttribute($bb2f6760763a0914$export$718faa7d6d01aabc.NORMAL_SPHEREMAPPED, $bb2f6760763a0914$export$f447a8ca794d62f1.DATA_TYPE_UINT8, 2),
    NORMAL_OCT16: $bb2f6760763a0914$var$makePointAttribute($bb2f6760763a0914$export$718faa7d6d01aabc.NORMAL_OCT16, $bb2f6760763a0914$export$f447a8ca794d62f1.DATA_TYPE_UINT8, 2),
    NORMAL: $bb2f6760763a0914$var$makePointAttribute($bb2f6760763a0914$export$718faa7d6d01aabc.NORMAL, $bb2f6760763a0914$export$f447a8ca794d62f1.DATA_TYPE_FLOAT, 3)
};
class $bb2f6760763a0914$export$33a55c29cc28473e {
    constructor(pointAttributeNames = []){
        this.attributes = [];
        this.byteSize = 0;
        this.size = 0;
        for(let i = 0; i < pointAttributeNames.length; i++){
            const pointAttributeName = pointAttributeNames[i];
            const pointAttribute = $bb2f6760763a0914$export$c9c943992b7ca9cc[pointAttributeName];
            this.attributes.push(pointAttribute);
            this.byteSize += pointAttribute.byteSize;
            this.size++;
        }
    }
    add(pointAttribute) {
        this.attributes.push(pointAttribute);
        this.byteSize += pointAttribute.byteSize;
        this.size++;
    }
    hasColors() {
        return this.attributes.find($bb2f6760763a0914$var$isColorAttribute) !== undefined;
    }
    hasNormals() {
        return this.attributes.find($bb2f6760763a0914$var$isNormalAttribute) !== undefined;
    }
}
function $bb2f6760763a0914$var$isColorAttribute({ name: name  }) {
    return name === $bb2f6760763a0914$export$718faa7d6d01aabc.COLOR_PACKED;
}
function $bb2f6760763a0914$var$isNormalAttribute({ name: name  }) {
    return name === $bb2f6760763a0914$export$718faa7d6d01aabc.NORMAL_SPHEREMAPPED || name === $bb2f6760763a0914$export$718faa7d6d01aabc.NORMAL_FLOATS || name === $bb2f6760763a0914$export$718faa7d6d01aabc.NORMAL || name === $bb2f6760763a0914$export$718faa7d6d01aabc.NORMAL_OCT16;
}


class $22192e979174ef1c$export$682c179f50ab847d {
    constructor(version){
        this.versionMinor = 0;
        this.version = version;
        const vmLength = version.indexOf('.') === -1 ? version.length : version.indexOf('.');
        this.versionMajor = parseInt(version.substr(0, vmLength), 10);
        this.versionMinor = parseInt(version.substr(vmLength + 1), 10);
        if (isNaN(this.versionMinor)) this.versionMinor = 0;
    }
    newerThan(version) {
        const v = new $22192e979174ef1c$export$682c179f50ab847d(version);
        if (this.versionMajor > v.versionMajor) return true;
        else if (this.versionMajor === v.versionMajor && this.versionMinor > v.versionMinor) return true;
        else return false;
    }
    equalOrHigher(version) {
        const v = new $22192e979174ef1c$export$682c179f50ab847d(version);
        if (this.versionMajor > v.versionMajor) return true;
        else if (this.versionMajor === v.versionMajor && this.versionMinor >= v.versionMinor) return true;
        else return false;
    }
    upTo(version) {
        return !this.newerThan(version);
    }
}


class $abda266827cd357d$export$2b0747140719d786 {
    constructor(buffer){
        this.tmp = new ArrayBuffer(4);
        this.tmpf = new Float32Array(this.tmp);
        this.tmpu8 = new Uint8Array(this.tmp);
        this.u8 = new Uint8Array(buffer);
    }
    getUint32(i) {
        return this.u8[i + 3] << 24 | this.u8[i + 2] << 16 | this.u8[i + 1] << 8 | this.u8[i];
    }
    getUint16(i) {
        return this.u8[i + 1] << 8 | this.u8[i];
    }
    getFloat32(i) {
        const tmpu8 = this.tmpu8;
        const u8 = this.u8;
        const tmpf = this.tmpf;
        tmpu8[0] = u8[i + 0];
        tmpu8[1] = u8[i + 1];
        tmpu8[2] = u8[i + 2];
        tmpu8[3] = u8[i + 3];
        return tmpf[0];
    }
    getUint8(i) {
        return this.u8[i];
    }
} // tslint:enable:no-bitwise


// IE11 does not have Math.sign(), this has been adapted from CoreJS es6.math.sign.js for TypeScript
const $25447e9aec1ad9b1$var$mathSign = Math.sign || function(x) {
    // tslint:disable-next-line:triple-equals
    return (x = +x) == 0 || x != x ? x : x < 0 ? -1 : 1;
};
function $25447e9aec1ad9b1$export$ca65614d7992560c(event) {
    const buffer = event.data.buffer;
    const pointAttributes = event.data.pointAttributes;
    const ctx = {
        attributeBuffers: {
        },
        currentOffset: 0,
        data: new $abda266827cd357d$export$2b0747140719d786(buffer),
        mean: [
            0,
            0,
            0
        ],
        nodeOffset: event.data.offset,
        numPoints: event.data.buffer.byteLength / pointAttributes.byteSize,
        pointAttributes: pointAttributes,
        scale: event.data.scale,
        tightBoxMax: [
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY
        ],
        tightBoxMin: [
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY
        ],
        transferables: [],
        version: new $22192e979174ef1c$export$682c179f50ab847d(event.data.version)
    };
    for (const pointAttribute of ctx.pointAttributes.attributes){
        $25447e9aec1ad9b1$var$decodeAndAddAttribute(pointAttribute, ctx);
        ctx.currentOffset += pointAttribute.byteSize;
    }
    const indices = new ArrayBuffer(ctx.numPoints * 4);
    const iIndices = new Uint32Array(indices);
    for(let i = 0; i < ctx.numPoints; i++)iIndices[i] = i;
    if (!ctx.attributeBuffers[$bb2f6760763a0914$export$718faa7d6d01aabc.CLASSIFICATION]) $25447e9aec1ad9b1$var$addEmptyClassificationBuffer(ctx);
    const message = {
        buffer: buffer,
        mean: ctx.mean,
        attributeBuffers: ctx.attributeBuffers,
        tightBoundingBox: {
            min: ctx.tightBoxMin,
            max: ctx.tightBoxMax
        },
        indices: indices
    };
    // console.log("old", message)
    postMessage(message, ctx.transferables);
}
function $25447e9aec1ad9b1$var$addEmptyClassificationBuffer(ctx) {
    const buffer = new ArrayBuffer(ctx.numPoints * 4);
    const classifications = new Float32Array(buffer);
    for(let i = 0; i < ctx.numPoints; i++)classifications[i] = 0;
    ctx.attributeBuffers[$bb2f6760763a0914$export$718faa7d6d01aabc.CLASSIFICATION] = {
        buffer: buffer,
        attribute: $bb2f6760763a0914$export$c9c943992b7ca9cc.CLASSIFICATION
    };
}
function $25447e9aec1ad9b1$var$decodeAndAddAttribute(attribute, ctx) {
    const decodedAttribute = $25447e9aec1ad9b1$var$decodePointAttribute(attribute, ctx);
    if (decodedAttribute === undefined) return;
    ctx.attributeBuffers[decodedAttribute.attribute.name] = decodedAttribute;
    ctx.transferables.push(decodedAttribute.buffer);
}
function $25447e9aec1ad9b1$var$decodePointAttribute(attribute, ctx) {
    switch(attribute.name){
        case $bb2f6760763a0914$export$718faa7d6d01aabc.POSITION_CARTESIAN:
            return $25447e9aec1ad9b1$var$decodePositionCartesian(attribute, ctx);
        case $bb2f6760763a0914$export$718faa7d6d01aabc.COLOR_PACKED:
            return $25447e9aec1ad9b1$var$decodeColor(attribute, ctx);
        case $bb2f6760763a0914$export$718faa7d6d01aabc.INTENSITY:
            return $25447e9aec1ad9b1$var$decodeIntensity(attribute, ctx);
        case $bb2f6760763a0914$export$718faa7d6d01aabc.CLASSIFICATION:
            return $25447e9aec1ad9b1$var$decodeClassification(attribute, ctx);
        case $bb2f6760763a0914$export$718faa7d6d01aabc.NORMAL_SPHEREMAPPED:
            return $25447e9aec1ad9b1$var$decodeNormalSphereMapped(attribute, ctx);
        case $bb2f6760763a0914$export$718faa7d6d01aabc.NORMAL_OCT16:
            return $25447e9aec1ad9b1$var$decodeNormalOct16(attribute, ctx);
        case $bb2f6760763a0914$export$718faa7d6d01aabc.NORMAL:
            return $25447e9aec1ad9b1$var$decodeNormal(attribute, ctx);
        default:
            return undefined;
    }
}
function $25447e9aec1ad9b1$var$decodePositionCartesian(attribute, ctx) {
    const buffer = new ArrayBuffer(ctx.numPoints * 12);
    const positions = new Float32Array(buffer);
    for(let i = 0; i < ctx.numPoints; i++){
        let x;
        let y;
        let z;
        if (ctx.version.newerThan('1.3')) {
            x = ctx.data.getUint32(ctx.currentOffset + i * ctx.pointAttributes.byteSize + 0) * ctx.scale;
            y = ctx.data.getUint32(ctx.currentOffset + i * ctx.pointAttributes.byteSize + 4) * ctx.scale;
            z = ctx.data.getUint32(ctx.currentOffset + i * ctx.pointAttributes.byteSize + 8) * ctx.scale;
        } else {
            x = ctx.data.getFloat32(i * ctx.pointAttributes.byteSize + 0) + ctx.nodeOffset[0];
            y = ctx.data.getFloat32(i * ctx.pointAttributes.byteSize + 4) + ctx.nodeOffset[1];
            z = ctx.data.getFloat32(i * ctx.pointAttributes.byteSize + 8) + ctx.nodeOffset[2];
        }
        positions[3 * i + 0] = x;
        positions[3 * i + 1] = y;
        positions[3 * i + 2] = z;
        ctx.mean[0] += x / ctx.numPoints;
        ctx.mean[1] += y / ctx.numPoints;
        ctx.mean[2] += z / ctx.numPoints;
        ctx.tightBoxMin[0] = Math.min(ctx.tightBoxMin[0], x);
        ctx.tightBoxMin[1] = Math.min(ctx.tightBoxMin[1], y);
        ctx.tightBoxMin[2] = Math.min(ctx.tightBoxMin[2], z);
        ctx.tightBoxMax[0] = Math.max(ctx.tightBoxMax[0], x);
        ctx.tightBoxMax[1] = Math.max(ctx.tightBoxMax[1], y);
        ctx.tightBoxMax[2] = Math.max(ctx.tightBoxMax[2], z);
    }
    return {
        buffer: buffer,
        attribute: attribute
    };
}
function $25447e9aec1ad9b1$var$decodeColor(attribute, ctx) {
    const buffer = new ArrayBuffer(ctx.numPoints * 3);
    const colors = new Uint8Array(buffer);
    for(let i = 0; i < ctx.numPoints; i++){
        colors[3 * i + 0] = ctx.data.getUint8(ctx.currentOffset + i * ctx.pointAttributes.byteSize + 0);
        colors[3 * i + 1] = ctx.data.getUint8(ctx.currentOffset + i * ctx.pointAttributes.byteSize + 1);
        colors[3 * i + 2] = ctx.data.getUint8(ctx.currentOffset + i * ctx.pointAttributes.byteSize + 2);
    }
    return {
        buffer: buffer,
        attribute: attribute
    };
}
function $25447e9aec1ad9b1$var$decodeIntensity(attribute, ctx) {
    const buffer = new ArrayBuffer(ctx.numPoints * 4);
    const intensities = new Float32Array(buffer);
    for(let i = 0; i < ctx.numPoints; i++)intensities[i] = ctx.data.getUint16(ctx.currentOffset + i * ctx.pointAttributes.byteSize);
    return {
        buffer: buffer,
        attribute: attribute
    };
}
function $25447e9aec1ad9b1$var$decodeClassification(attribute, ctx) {
    const buffer = new ArrayBuffer(ctx.numPoints);
    const classifications = new Uint8Array(buffer);
    for(let j = 0; j < ctx.numPoints; j++)classifications[j] = ctx.data.getUint8(ctx.currentOffset + j * ctx.pointAttributes.byteSize);
    return {
        buffer: buffer,
        attribute: attribute
    };
}
function $25447e9aec1ad9b1$var$decodeNormalSphereMapped(attribute, ctx) {
    const buffer = new ArrayBuffer(ctx.numPoints * 12);
    const normals = new Float32Array(buffer);
    for(let j = 0; j < ctx.numPoints; j++){
        const bx = ctx.data.getUint8(ctx.currentOffset + j * ctx.pointAttributes.byteSize + 0);
        const by = ctx.data.getUint8(ctx.currentOffset + j * ctx.pointAttributes.byteSize + 1);
        const ex = bx / 255;
        const ey = by / 255;
        let nx = ex * 2 - 1;
        let ny = ey * 2 - 1;
        let nz = 1;
        const nw = -1;
        const l = nx * -nx + ny * -ny + nz * -nw;
        nz = l;
        nx = nx * Math.sqrt(l);
        ny = ny * Math.sqrt(l);
        nx = nx * 2;
        ny = ny * 2;
        nz = nz * 2 - 1;
        normals[3 * j + 0] = nx;
        normals[3 * j + 1] = ny;
        normals[3 * j + 2] = nz;
    }
    return {
        buffer: buffer,
        attribute: attribute
    };
}
function $25447e9aec1ad9b1$var$decodeNormalOct16(attribute, ctx) {
    const buff = new ArrayBuffer(ctx.numPoints * 12);
    const normals = new Float32Array(buff);
    for(let j = 0; j < ctx.numPoints; j++){
        const bx = ctx.data.getUint8(ctx.currentOffset + j * ctx.pointAttributes.byteSize + 0);
        const by = ctx.data.getUint8(ctx.currentOffset + j * ctx.pointAttributes.byteSize + 1);
        const u = bx / 255 * 2 - 1;
        const v = by / 255 * 2 - 1;
        let z = 1 - Math.abs(u) - Math.abs(v);
        let x = 0;
        let y = 0;
        if (z >= 0) {
            x = u;
            y = v;
        } else {
            x = -(v / $25447e9aec1ad9b1$var$mathSign(v) - 1) / $25447e9aec1ad9b1$var$mathSign(u);
            y = -(u / $25447e9aec1ad9b1$var$mathSign(u) - 1) / $25447e9aec1ad9b1$var$mathSign(v);
        }
        const length = Math.sqrt(x * x + y * y + z * z);
        x = x / length;
        y = y / length;
        z = z / length;
        normals[3 * j + 0] = x;
        normals[3 * j + 1] = y;
        normals[3 * j + 2] = z;
    }
    return {
        buffer: buff,
        attribute: attribute
    };
}
function $25447e9aec1ad9b1$var$decodeNormal(attribute, ctx) {
    const buffer = new ArrayBuffer(ctx.numPoints * 12);
    const normals = new Float32Array(buffer);
    for(let j = 0; j < ctx.numPoints; j++){
        const x = ctx.data.getFloat32(ctx.currentOffset + j * ctx.pointAttributes.byteSize + 0);
        const y = ctx.data.getFloat32(ctx.currentOffset + j * ctx.pointAttributes.byteSize + 4);
        const z = ctx.data.getFloat32(ctx.currentOffset + j * ctx.pointAttributes.byteSize + 8);
        normals[3 * j + 0] = x;
        normals[3 * j + 1] = y;
        normals[3 * j + 2] = z;
    }
    return {
        buffer: buffer,
        attribute: attribute
    };
}


/*eslint-disable */ onmessage = $25447e9aec1ad9b1$export$ca65614d7992560c;


//# sourceMappingURL=binary-decoder.worker.c2d44a5e.js.map

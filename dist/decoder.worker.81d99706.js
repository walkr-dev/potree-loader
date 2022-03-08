/**
 * Some types of possible point attribute data formats
 *
 * @class
 */ const $97cf98a876f14d62$export$4a34a80e6342e491 = {
    DATA_TYPE_DOUBLE: {
        ordinal: 0,
        name: "double",
        size: 8
    },
    DATA_TYPE_FLOAT: {
        ordinal: 1,
        name: "float",
        size: 4
    },
    DATA_TYPE_INT8: {
        ordinal: 2,
        name: "int8",
        size: 1
    },
    DATA_TYPE_UINT8: {
        ordinal: 3,
        name: "uint8",
        size: 1
    },
    DATA_TYPE_INT16: {
        ordinal: 4,
        name: "int16",
        size: 2
    },
    DATA_TYPE_UINT16: {
        ordinal: 5,
        name: "uint16",
        size: 2
    },
    DATA_TYPE_INT32: {
        ordinal: 6,
        name: "int32",
        size: 4
    },
    DATA_TYPE_UINT32: {
        ordinal: 7,
        name: "uint32",
        size: 4
    },
    DATA_TYPE_INT64: {
        ordinal: 8,
        name: "int64",
        size: 8
    },
    DATA_TYPE_UINT64: {
        ordinal: 9,
        name: "uint64",
        size: 8
    }
};
let $97cf98a876f14d62$var$i = 0;
for(let obj in $97cf98a876f14d62$export$4a34a80e6342e491){
    $97cf98a876f14d62$export$4a34a80e6342e491[$97cf98a876f14d62$var$i] = $97cf98a876f14d62$export$4a34a80e6342e491[obj];
    $97cf98a876f14d62$var$i++;
}
// Class that represents a certain point attribute
class $97cf98a876f14d62$export$4fe36b08757d7602 {
    constructor(name, type, numElements, range = [
        Infinity,
        -Infinity
    ]){
        this.name = name;
        this.type = type;
        this.numElements = numElements;
        this.range = range;
        this.byteSize = this.numElements * this.type.size;
        this.description = "";
    }
}
const $97cf98a876f14d62$export$c9c943992b7ca9cc = {
    POSITION_CARTESIAN: new $97cf98a876f14d62$export$4fe36b08757d7602("POSITION_CARTESIAN", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_FLOAT, 3),
    RGBA_PACKED: new $97cf98a876f14d62$export$4fe36b08757d7602("COLOR_PACKED", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_INT8, 4),
    COLOR_PACKED: new $97cf98a876f14d62$export$4fe36b08757d7602("COLOR_PACKED", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_INT8, 4),
    RGB_PACKED: new $97cf98a876f14d62$export$4fe36b08757d7602("COLOR_PACKED", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_INT8, 3),
    NORMAL_FLOATS: new $97cf98a876f14d62$export$4fe36b08757d7602("NORMAL_FLOATS", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_FLOAT, 3),
    INTENSITY: new $97cf98a876f14d62$export$4fe36b08757d7602("INTENSITY", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_UINT16, 1),
    CLASSIFICATION: new $97cf98a876f14d62$export$4fe36b08757d7602("CLASSIFICATION", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_UINT8, 1),
    NORMAL_SPHEREMAPPED: new $97cf98a876f14d62$export$4fe36b08757d7602("NORMAL_SPHEREMAPPED", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_UINT8, 2),
    NORMAL_OCT16: new $97cf98a876f14d62$export$4fe36b08757d7602("NORMAL_OCT16", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_UINT8, 2),
    NORMAL: new $97cf98a876f14d62$export$4fe36b08757d7602("NORMAL", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_FLOAT, 3),
    RETURN_NUMBER: new $97cf98a876f14d62$export$4fe36b08757d7602("RETURN_NUMBER", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_UINT8, 1),
    NUMBER_OF_RETURNS: new $97cf98a876f14d62$export$4fe36b08757d7602("NUMBER_OF_RETURNS", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_UINT8, 1),
    SOURCE_ID: new $97cf98a876f14d62$export$4fe36b08757d7602("SOURCE_ID", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_UINT16, 1),
    INDICES: new $97cf98a876f14d62$export$4fe36b08757d7602("INDICES", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_UINT32, 1),
    SPACING: new $97cf98a876f14d62$export$4fe36b08757d7602("SPACING", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_FLOAT, 1),
    GPS_TIME: new $97cf98a876f14d62$export$4fe36b08757d7602("GPS_TIME", $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_DOUBLE, 1)
};
class $97cf98a876f14d62$export$33a55c29cc28473e {
    // pointAttributes will be a list of strings
    constructor(pointAttributes, attributes = [], byteSize = 0, size = 0, vectors = []){
        this.attributes = attributes;
        this.byteSize = byteSize;
        this.size = size;
        this.vectors = vectors;
        if (pointAttributes != null) for(let i = 0; i < pointAttributes.length; i++){
            let pointAttributeName = pointAttributes[i];
            let pointAttribute = $97cf98a876f14d62$export$c9c943992b7ca9cc[pointAttributeName];
            this.attributes.push(pointAttribute);
            this.byteSize += pointAttribute.byteSize;
            this.size++;
        }
    }
    // I hate these argument names that are so similar to each other but have completely different types
    add(pointAttribute) {
        this.attributes.push(pointAttribute);
        this.byteSize += pointAttribute.byteSize;
        this.size++;
    }
    addVector(vector) {
        this.vectors.push(vector);
    }
    hasNormals() {
        for(let name in this.attributes){
            let pointAttribute = this.attributes[name];
            if (pointAttribute === $97cf98a876f14d62$export$c9c943992b7ca9cc.NORMAL_SPHEREMAPPED || pointAttribute === $97cf98a876f14d62$export$c9c943992b7ca9cc.NORMAL_FLOATS || pointAttribute === $97cf98a876f14d62$export$c9c943992b7ca9cc.NORMAL || pointAttribute === $97cf98a876f14d62$export$c9c943992b7ca9cc.NORMAL_OCT16) return true;
        }
        return false;
    }
}


const $7ea2b4434a2e74b1$var$typedArrayMapping = {
    "int8": Int8Array,
    "int16": Int16Array,
    "int32": Int32Array,
    "int64": Float64Array,
    "uint8": Uint8Array,
    "uint16": Uint16Array,
    "uint32": Uint32Array,
    "uint64": Float64Array,
    "float": Float32Array,
    "double": Float64Array
};
Potree = {
};
onmessage = function(event) {
    let { buffer: buffer , pointAttributes: pointAttributes , scale: scale , name: name , min: min , max: max , size: size , offset: offset , numPoints: numPoints  } = event.data;
    let tStart = performance.now();
    let view = new DataView(buffer);
    let attributeBuffers = {
    };
    let attributeOffset = 0;
    let bytesPerPoint = 0;
    for (let pointAttribute of pointAttributes.attributes)bytesPerPoint += pointAttribute.byteSize;
    let gridSize = 32;
    let grid = new Uint32Array(gridSize ** 3);
    let toIndex = (x, y, z)=>{
        // let dx = gridSize * (x - min.x) / size.x;
        // let dy = gridSize * (y - min.y) / size.y;
        // let dz = gridSize * (z - min.z) / size.z;
        // min is already subtracted
        let dx = gridSize * x / size.x;
        let dy = gridSize * y / size.y;
        let dz = gridSize * z / size.z;
        let ix = Math.min(parseInt(dx), gridSize - 1);
        let iy = Math.min(parseInt(dy), gridSize - 1);
        let iz = Math.min(parseInt(dz), gridSize - 1);
        let index = ix + iy * gridSize + iz * gridSize * gridSize;
        return index;
    };
    let numOccupiedCells = 0;
    for (let pointAttribute1 of pointAttributes.attributes){
        if ([
            "POSITION_CARTESIAN",
            "position"
        ].includes(pointAttribute1.name)) {
            let buff = new ArrayBuffer(numPoints * 12);
            let positions = new Float32Array(buff);
            for(let j = 0; j < numPoints; j++){
                let pointOffset = j * bytesPerPoint;
                let x = view.getInt32(pointOffset + attributeOffset + 0, true) * scale[0] + offset[0] - min.x;
                let y = view.getInt32(pointOffset + attributeOffset + 4, true) * scale[1] + offset[1] - min.y;
                let z = view.getInt32(pointOffset + attributeOffset + 8, true) * scale[2] + offset[2] - min.z;
                let index = toIndex(x, y, z);
                let count = grid[index]++;
                if (count === 0) numOccupiedCells++;
                positions[3 * j + 0] = x;
                positions[3 * j + 1] = y;
                positions[3 * j + 2] = z;
            }
            attributeBuffers[pointAttribute1.name] = {
                buffer: buff,
                attribute: pointAttribute1
            };
        } else if ([
            "RGBA",
            "rgba"
        ].includes(pointAttribute1.name)) {
            let buff = new ArrayBuffer(numPoints * 4);
            let colors = new Uint8Array(buff);
            for(let j = 0; j < numPoints; j++){
                let pointOffset = j * bytesPerPoint;
                let r = view.getUint16(pointOffset + attributeOffset + 0, true);
                let g = view.getUint16(pointOffset + attributeOffset + 2, true);
                let b = view.getUint16(pointOffset + attributeOffset + 4, true);
                colors[4 * j + 0] = r > 255 ? r / 256 : r;
                colors[4 * j + 1] = g > 255 ? g / 256 : g;
                colors[4 * j + 2] = b > 255 ? b / 256 : b;
            }
            attributeBuffers[pointAttribute1.name] = {
                buffer: buff,
                attribute: pointAttribute1
            };
        } else {
            let buff = new ArrayBuffer(numPoints * 4);
            let f32 = new Float32Array(buff);
            let TypedArray = $7ea2b4434a2e74b1$var$typedArrayMapping[pointAttribute1.type.name];
            preciseBuffer = new TypedArray(numPoints);
            let [offset, scale] = [
                0,
                1
            ];
            const getterMap = {
                "int8": view.getInt8,
                "int16": view.getInt16,
                "int32": view.getInt32,
                // "int64":  view.getInt64,
                "uint8": view.getUint8,
                "uint16": view.getUint16,
                "uint32": view.getUint32,
                // "uint64": view.getUint64,
                "float": view.getFloat32,
                "double": view.getFloat64
            };
            const getter = getterMap[pointAttribute1.type.name].bind(view);
            // compute offset and scale to pack larger types into 32 bit floats
            if (pointAttribute1.type.size > 4) {
                let [amin, amax] = pointAttribute1.range;
                offset = amin;
                scale = 1 / (amax - amin);
            }
            for(let j = 0; j < numPoints; j++){
                let pointOffset = j * bytesPerPoint;
                let value = getter(pointOffset + attributeOffset, true);
                f32[j] = (value - offset) * scale;
                preciseBuffer[j] = value;
            }
            attributeBuffers[pointAttribute1.name] = {
                buffer: buff,
                preciseBuffer: preciseBuffer,
                attribute: pointAttribute1,
                offset: offset,
                scale: scale
            };
        }
        attributeOffset += pointAttribute1.byteSize;
    }
    let occupancy = parseInt(numPoints / numOccupiedCells);
    // console.log(`${name}: #points: ${numPoints}: #occupiedCells: ${numOccupiedCells}, occupancy: ${occupancy} points/cell`);
    {
        let buff = new ArrayBuffer(numPoints * 4);
        let indices = new Uint32Array(buff);
        for(let i = 0; i < numPoints; i++)indices[i] = i;
        attributeBuffers["INDICES"] = {
            buffer: buff,
            attribute: $97cf98a876f14d62$export$4fe36b08757d7602.INDICES
        };
    }
    {
        let vectors = pointAttributes.vectors;
        for (let vector of vectors){
            let { name: name , attributes: attributes  } = vector;
            let numVectorElements = attributes.length;
            let buffer = new ArrayBuffer(numVectorElements * numPoints * 4);
            let f32 = new Float32Array(buffer);
            let iElement = 0;
            for (let sourceName of attributes){
                let sourceBuffer = attributeBuffers[sourceName];
                let { offset: offset , scale: scale  } = sourceBuffer;
                let view = new DataView(sourceBuffer.buffer);
                const getter = view.getFloat32.bind(view);
                for(let j = 0; j < numPoints; j++){
                    let value = getter(j * 4, true);
                    f32[j * numVectorElements + iElement] = value / scale + offset;
                }
                iElement++;
            }
            let vecAttribute = new $97cf98a876f14d62$export$4fe36b08757d7602(name, $97cf98a876f14d62$export$4a34a80e6342e491.DATA_TYPE_FLOAT, 3);
            attributeBuffers[name] = {
                buffer: buffer,
                attribute: vecAttribute
            };
        }
    }
    // let duration = performance.now() - tStart;
    // let pointsPerMs = numPoints / duration;
    // console.log(`duration: ${duration.toFixed(1)}ms, #points: ${numPoints}, points/ms: ${pointsPerMs.toFixed(1)}`);
    let message = {
        buffer: buffer,
        attributeBuffers: attributeBuffers,
        density: occupancy
    };
    let transferables = [];
    for(let property in message.attributeBuffers)transferables.push(message.attributeBuffers[property].buffer);
    transferables.push(buffer);
    // console.log("new", message)
    postMessage(message, transferables);
};


//# sourceMappingURL=decoder.worker.81d99706.js.map

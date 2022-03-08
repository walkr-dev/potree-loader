// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (modules, entry, mainEntry, parcelRequireName, globalName) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        this
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });

      // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }
})({"0EUi6":[function(require,module,exports) {
"use strict";
var HMR_HOST = null;
var HMR_PORT = null;
var HMR_SECURE = false;
var HMR_ENV_HASH = "a8fb9c35fdafe466";
module.bundle.HMR_BUNDLE_ID = "c0cb88b64220895a";
function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _createForOfIteratorHelper(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (!it) {
        if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it) o = it;
            var i = 0;
            var F = function F() {
            };
            return {
                s: F,
                n: function n() {
                    if (i >= o.length) return {
                        done: true
                    };
                    return {
                        done: false,
                        value: o[i++]
                    };
                },
                e: function e(_e) {
                    throw _e;
                },
                f: F
            };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var normalCompletion = true, didErr = false, err;
    return {
        s: function s() {
            it = it.call(o);
        },
        n: function n() {
            var step = it.next();
            normalCompletion = step.done;
            return step;
        },
        e: function e(_e2) {
            didErr = true;
            err = _e2;
        },
        f: function f() {
            try {
                if (!normalCompletion && it.return != null) it.return();
            } finally{
                if (didErr) throw err;
            }
        }
    };
}
function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
/* global HMR_HOST, HMR_PORT, HMR_ENV_HASH, HMR_SECURE */ /*::
import type {
  HMRAsset,
  HMRMessage,
} from '@parcel/reporter-dev-server/src/HMRServer.js';
interface ParcelRequire {
  (string): mixed;
  cache: {|[string]: ParcelModule|};
  hotData: mixed;
  Module: any;
  parent: ?ParcelRequire;
  isParcelRequire: true;
  modules: {|[string]: [Function, {|[string]: string|}]|};
  HMR_BUNDLE_ID: string;
  root: ParcelRequire;
}
interface ParcelModule {
  hot: {|
    data: mixed,
    accept(cb: (Function) => void): void,
    dispose(cb: (mixed) => void): void,
    // accept(deps: Array<string> | string, cb: (Function) => void): void,
    // decline(): void,
    _acceptCallbacks: Array<(Function) => void>,
    _disposeCallbacks: Array<(mixed) => void>,
  |};
}
declare var module: {bundle: ParcelRequire, ...};
declare var HMR_HOST: string;
declare var HMR_PORT: string;
declare var HMR_ENV_HASH: string;
declare var HMR_SECURE: boolean;
*/ var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
    OldModule.call(this, moduleName);
    this.hot = {
        data: module.bundle.hotData,
        _acceptCallbacks: [],
        _disposeCallbacks: [],
        accept: function accept(fn) {
            this._acceptCallbacks.push(fn || function() {
            });
        },
        dispose: function dispose(fn) {
            this._disposeCallbacks.push(fn);
        }
    };
    module.bundle.hotData = undefined;
}
module.bundle.Module = Module;
var checkedAssets, acceptedAssets, assetsToAccept;
function getHostname() {
    return HMR_HOST || (location.protocol.indexOf('http') === 0 ? location.hostname : 'localhost');
}
function getPort() {
    return HMR_PORT || location.port;
} // eslint-disable-next-line no-redeclare
var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
    var hostname = getHostname();
    var port = getPort();
    var protocol = HMR_SECURE || location.protocol == 'https:' && !/localhost|127.0.0.1|0.0.0.0/.test(hostname) ? 'wss' : 'ws';
    var ws = new WebSocket(protocol + '://' + hostname + (port ? ':' + port : '') + '/'); // $FlowFixMe
    ws.onmessage = function(event) {
        checkedAssets = {
        };
        acceptedAssets = {
        };
        assetsToAccept = [];
        var data = JSON.parse(event.data);
        if (data.type === 'update') {
            // Remove error overlay if there is one
            if (typeof document !== 'undefined') removeErrorOverlay();
            var assets = data.assets.filter(function(asset) {
                return asset.envHash === HMR_ENV_HASH;
            }); // Handle HMR Update
            var handled = assets.every(function(asset) {
                return asset.type === 'css' || asset.type === 'js' && hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle);
            });
            if (handled) {
                console.clear();
                assets.forEach(function(asset) {
                    hmrApply(module.bundle.root, asset);
                });
                for(var i = 0; i < assetsToAccept.length; i++){
                    var id = assetsToAccept[i][1];
                    if (!acceptedAssets[id]) hmrAcceptRun(assetsToAccept[i][0], id);
                }
            } else window.location.reload();
        }
        if (data.type === 'error') {
            // Log parcel errors to console
            var _iterator = _createForOfIteratorHelper(data.diagnostics.ansi), _step;
            try {
                for(_iterator.s(); !(_step = _iterator.n()).done;){
                    var ansiDiagnostic = _step.value;
                    var stack = ansiDiagnostic.codeframe ? ansiDiagnostic.codeframe : ansiDiagnostic.stack;
                    console.error('🚨 [parcel]: ' + ansiDiagnostic.message + '\n' + stack + '\n\n' + ansiDiagnostic.hints.join('\n'));
                }
            } catch (err) {
                _iterator.e(err);
            } finally{
                _iterator.f();
            }
            if (typeof document !== 'undefined') {
                // Render the fancy html overlay
                removeErrorOverlay();
                var overlay = createErrorOverlay(data.diagnostics.html); // $FlowFixMe
                document.body.appendChild(overlay);
            }
        }
    };
    ws.onerror = function(e) {
        console.error(e.message);
    };
    ws.onclose = function() {
        console.warn('[parcel] 🚨 Connection to the HMR server was lost');
    };
}
function removeErrorOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.remove();
        console.log('[parcel] ✨ Error resolved');
    }
}
function createErrorOverlay(diagnostics) {
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    var errorHTML = '<div style="background: black; opacity: 0.85; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; font-family: Menlo, Consolas, monospace; z-index: 9999;">';
    var _iterator2 = _createForOfIteratorHelper(diagnostics), _step2;
    try {
        for(_iterator2.s(); !(_step2 = _iterator2.n()).done;){
            var diagnostic = _step2.value;
            var stack = diagnostic.codeframe ? diagnostic.codeframe : diagnostic.stack;
            errorHTML += "\n      <div>\n        <div style=\"font-size: 18px; font-weight: bold; margin-top: 20px;\">\n          \uD83D\uDEA8 ".concat(diagnostic.message, "\n        </div>\n        <pre>").concat(stack, "</pre>\n        <div>\n          ").concat(diagnostic.hints.map(function(hint) {
                return '<div>💡 ' + hint + '</div>';
            }).join(''), "\n        </div>\n        ").concat(diagnostic.documentation ? "<div>\uD83D\uDCDD <a style=\"color: violet\" href=\"".concat(diagnostic.documentation, "\" target=\"_blank\">Learn more</a></div>") : '', "\n      </div>\n    ");
        }
    } catch (err) {
        _iterator2.e(err);
    } finally{
        _iterator2.f();
    }
    errorHTML += '</div>';
    overlay.innerHTML = errorHTML;
    return overlay;
}
function getParents(bundle, id) /*: Array<[ParcelRequire, string]> */ {
    var modules = bundle.modules;
    if (!modules) return [];
    var parents = [];
    var k, d, dep;
    for(k in modules)for(d in modules[k][1]){
        dep = modules[k][1][d];
        if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) parents.push([
            bundle,
            k
        ]);
    }
    if (bundle.parent) parents = parents.concat(getParents(bundle.parent, id));
    return parents;
}
function updateLink(link) {
    var newLink = link.cloneNode();
    newLink.onload = function() {
        if (link.parentNode !== null) // $FlowFixMe
        link.parentNode.removeChild(link);
    };
    newLink.setAttribute('href', link.getAttribute('href').split('?')[0] + '?' + Date.now()); // $FlowFixMe
    link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
    if (cssTimeout) return;
    cssTimeout = setTimeout(function() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for(var i = 0; i < links.length; i++){
            // $FlowFixMe[incompatible-type]
            var href = links[i].getAttribute('href');
            var hostname = getHostname();
            var servedFromHMRServer = hostname === 'localhost' ? new RegExp('^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):' + getPort()).test(href) : href.indexOf(hostname + ':' + getPort());
            var absolute = /^https?:\/\//i.test(href) && href.indexOf(window.location.origin) !== 0 && !servedFromHMRServer;
            if (!absolute) updateLink(links[i]);
        }
        cssTimeout = null;
    }, 50);
}
function hmrApply(bundle, asset) {
    var modules = bundle.modules;
    if (!modules) return;
    if (asset.type === 'css') reloadCSS();
    else if (asset.type === 'js') {
        var deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID];
        if (deps) {
            if (modules[asset.id]) {
                // Remove dependencies that are removed and will become orphaned.
                // This is necessary so that if the asset is added back again, the cache is gone, and we prevent a full page reload.
                var oldDeps = modules[asset.id][1];
                for(var dep in oldDeps)if (!deps[dep] || deps[dep] !== oldDeps[dep]) {
                    var id = oldDeps[dep];
                    var parents = getParents(module.bundle.root, id);
                    if (parents.length === 1) hmrDelete(module.bundle.root, id);
                }
            }
            var fn = new Function('require', 'module', 'exports', asset.output);
            modules[asset.id] = [
                fn,
                deps
            ];
        } else if (bundle.parent) hmrApply(bundle.parent, asset);
    }
}
function hmrDelete(bundle, id1) {
    var modules = bundle.modules;
    if (!modules) return;
    if (modules[id1]) {
        // Collect dependencies that will become orphaned when this module is deleted.
        var deps = modules[id1][1];
        var orphans = [];
        for(var dep in deps){
            var parents = getParents(module.bundle.root, deps[dep]);
            if (parents.length === 1) orphans.push(deps[dep]);
        } // Delete the module. This must be done before deleting dependencies in case of circular dependencies.
        delete modules[id1];
        delete bundle.cache[id1]; // Now delete the orphans.
        orphans.forEach(function(id) {
            hmrDelete(module.bundle.root, id);
        });
    } else if (bundle.parent) hmrDelete(bundle.parent, id1);
}
function hmrAcceptCheck(bundle, id, depsByBundle) {
    if (hmrAcceptCheckOne(bundle, id, depsByBundle)) return true;
     // Traverse parents breadth first. All possible ancestries must accept the HMR update, or we'll reload.
    var parents = getParents(module.bundle.root, id);
    var accepted = false;
    while(parents.length > 0){
        var v = parents.shift();
        var a = hmrAcceptCheckOne(v[0], v[1], null);
        if (a) // If this parent accepts, stop traversing upward, but still consider siblings.
        accepted = true;
        else {
            // Otherwise, queue the parents in the next level upward.
            var p = getParents(module.bundle.root, v[1]);
            if (p.length === 0) {
                // If there are no parents, then we've reached an entry without accepting. Reload.
                accepted = false;
                break;
            }
            parents.push.apply(parents, _toConsumableArray(p));
        }
    }
    return accepted;
}
function hmrAcceptCheckOne(bundle, id, depsByBundle) {
    var modules = bundle.modules;
    if (!modules) return;
    if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
        // If we reached the root bundle without finding where the asset should go,
        // there's nothing to do. Mark as "accepted" so we don't reload the page.
        if (!bundle.parent) return true;
        return hmrAcceptCheck(bundle.parent, id, depsByBundle);
    }
    if (checkedAssets[id]) return true;
    checkedAssets[id] = true;
    var cached = bundle.cache[id];
    assetsToAccept.push([
        bundle,
        id
    ]);
    if (!cached || cached.hot && cached.hot._acceptCallbacks.length) return true;
}
function hmrAcceptRun(bundle, id) {
    var cached = bundle.cache[id];
    bundle.hotData = {
    };
    if (cached && cached.hot) cached.hot.data = bundle.hotData;
    if (cached && cached.hot && cached.hot._disposeCallbacks.length) cached.hot._disposeCallbacks.forEach(function(cb) {
        cb(bundle.hotData);
    });
    delete bundle.cache[id];
    bundle(id);
    cached = bundle.cache[id];
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) cached.hot._acceptCallbacks.forEach(function(cb) {
        var assetsToAlsoAccept = cb(function() {
            return getParents(module.bundle.root, id);
        });
        if (assetsToAlsoAccept && assetsToAccept.length) // $FlowFixMe[method-unbinding]
        assetsToAccept.push.apply(assetsToAccept, assetsToAlsoAccept);
    });
    acceptedAssets[id] = true;
}

},{}],"khrNh":[function(require,module,exports) {
var _pointAttributes = require("./PointAttributes");
const typedArrayMapping = {
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
    let { buffer , pointAttributes , scale , name , min , max , size , offset , numPoints  } = event.data;
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
            let TypedArray = typedArrayMapping[pointAttribute1.type.name];
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
            attribute: _pointAttributes.PointAttribute.INDICES
        };
    }
    {
        let vectors = pointAttributes.vectors;
        for (let vector of vectors){
            let { name , attributes  } = vector;
            let numVectorElements = attributes.length;
            let buffer = new ArrayBuffer(numVectorElements * numPoints * 4);
            let f32 = new Float32Array(buffer);
            let iElement = 0;
            for (let sourceName of attributes){
                let sourceBuffer = attributeBuffers[sourceName];
                let { offset , scale  } = sourceBuffer;
                let view = new DataView(sourceBuffer.buffer);
                const getter = view.getFloat32.bind(view);
                for(let j = 0; j < numPoints; j++){
                    let value = getter(j * 4, true);
                    f32[j * numVectorElements + iElement] = value / scale + offset;
                }
                iElement++;
            }
            let vecAttribute = new _pointAttributes.PointAttribute(name, _pointAttributes.PointAttributeTypes.DATA_TYPE_FLOAT, 3);
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

},{"./PointAttributes":"14KXh"}],"14KXh":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "PointAttributeTypes", ()=>PointAttributeTypes
);
parcelHelpers.export(exports, "PointAttribute", ()=>PointAttribute
);
parcelHelpers.export(exports, "POINT_ATTRIBUTES", ()=>POINT_ATTRIBUTES
);
// Instantiated during loading
parcelHelpers.export(exports, "PointAttributes", ()=>PointAttributes
);
/**
 * Some types of possible point attribute data formats
 *
 * @class
 */ const PointAttributeTypes = {
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
let i = 0;
for(let obj in PointAttributeTypes){
    PointAttributeTypes[i] = PointAttributeTypes[obj];
    i++;
}
// Class that represents a certain point attribute
class PointAttribute {
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
const POINT_ATTRIBUTES = {
    POSITION_CARTESIAN: new PointAttribute("POSITION_CARTESIAN", PointAttributeTypes.DATA_TYPE_FLOAT, 3),
    RGBA_PACKED: new PointAttribute("COLOR_PACKED", PointAttributeTypes.DATA_TYPE_INT8, 4),
    COLOR_PACKED: new PointAttribute("COLOR_PACKED", PointAttributeTypes.DATA_TYPE_INT8, 4),
    RGB_PACKED: new PointAttribute("COLOR_PACKED", PointAttributeTypes.DATA_TYPE_INT8, 3),
    NORMAL_FLOATS: new PointAttribute("NORMAL_FLOATS", PointAttributeTypes.DATA_TYPE_FLOAT, 3),
    INTENSITY: new PointAttribute("INTENSITY", PointAttributeTypes.DATA_TYPE_UINT16, 1),
    CLASSIFICATION: new PointAttribute("CLASSIFICATION", PointAttributeTypes.DATA_TYPE_UINT8, 1),
    NORMAL_SPHEREMAPPED: new PointAttribute("NORMAL_SPHEREMAPPED", PointAttributeTypes.DATA_TYPE_UINT8, 2),
    NORMAL_OCT16: new PointAttribute("NORMAL_OCT16", PointAttributeTypes.DATA_TYPE_UINT8, 2),
    NORMAL: new PointAttribute("NORMAL", PointAttributeTypes.DATA_TYPE_FLOAT, 3),
    RETURN_NUMBER: new PointAttribute("RETURN_NUMBER", PointAttributeTypes.DATA_TYPE_UINT8, 1),
    NUMBER_OF_RETURNS: new PointAttribute("NUMBER_OF_RETURNS", PointAttributeTypes.DATA_TYPE_UINT8, 1),
    SOURCE_ID: new PointAttribute("SOURCE_ID", PointAttributeTypes.DATA_TYPE_UINT16, 1),
    INDICES: new PointAttribute("INDICES", PointAttributeTypes.DATA_TYPE_UINT32, 1),
    SPACING: new PointAttribute("SPACING", PointAttributeTypes.DATA_TYPE_FLOAT, 1),
    GPS_TIME: new PointAttribute("GPS_TIME", PointAttributeTypes.DATA_TYPE_DOUBLE, 1)
};
class PointAttributes {
    // pointAttributes will be a list of strings
    constructor(pointAttributes, attributes = [], byteSize = 0, size = 0, vectors = []){
        this.attributes = attributes;
        this.byteSize = byteSize;
        this.size = size;
        this.vectors = vectors;
        if (pointAttributes != null) for(let i1 = 0; i1 < pointAttributes.length; i1++){
            let pointAttributeName = pointAttributes[i1];
            let pointAttribute = POINT_ATTRIBUTES[pointAttributeName];
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
            if (pointAttribute === POINT_ATTRIBUTES.NORMAL_SPHEREMAPPED || pointAttribute === POINT_ATTRIBUTES.NORMAL_FLOATS || pointAttribute === POINT_ATTRIBUTES.NORMAL || pointAttribute === POINT_ATTRIBUTES.NORMAL_OCT16) return true;
        }
        return false;
    }
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"fn8Fk"}],"fn8Fk":[function(require,module,exports) {
exports.interopDefault = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
};
exports.defineInteropFlag = function(a) {
    Object.defineProperty(a, '__esModule', {
        value: true
    });
};
exports.exportAll = function(source, dest) {
    Object.keys(source).forEach(function(key) {
        if (key === 'default' || key === '__esModule' || dest.hasOwnProperty(key)) return;
        Object.defineProperty(dest, key, {
            enumerable: true,
            get: function() {
                return source[key];
            }
        });
    });
    return dest;
};
exports.export = function(dest, destName, get) {
    Object.defineProperty(dest, destName, {
        enumerable: true,
        get: get
    });
};

},{}]},["0EUi6","khrNh"], "khrNh", "parcelRequirefa99")

//# sourceMappingURL=decoder.worker.4220895a.js.map

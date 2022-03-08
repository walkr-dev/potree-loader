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
})({"hCCgf":[function(require,module,exports) {
"use strict";
var HMR_HOST = null;
var HMR_PORT = null;
var HMR_SECURE = false;
var HMR_ENV_HASH = "a8fb9c35fdafe466";
module.bundle.HMR_BUNDLE_ID = "523a0b04778111b1";
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

},{}],"lrQRU":[function(require,module,exports) {
var _binaryDecoderWorkerInternal = require("./binary-decoder-worker-internal");
/*eslint-disable */ onmessage = _binaryDecoderWorkerInternal.handleMessage;

},{"./binary-decoder-worker-internal":"hoXbw"}],"hoXbw":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "handleMessage", ()=>handleMessage
);
/**
 * Adapted from Potree.js http://potree.org
 * Potree License: https://github.com/potree/potree/blob/1.5/LICENSE
 */ var _pointAttributes = require("../point-attributes");
var _version = require("../version");
var _customArrayView = require("./custom-array-view");
// IE11 does not have Math.sign(), this has been adapted from CoreJS es6.math.sign.js for TypeScript
const mathSign = Math.sign || function(x) {
    // tslint:disable-next-line:triple-equals
    return (x = +x) == 0 || x != x ? x : x < 0 ? -1 : 1;
};
function handleMessage(event) {
    const buffer = event.data.buffer;
    const pointAttributes = event.data.pointAttributes;
    const ctx = {
        attributeBuffers: {
        },
        currentOffset: 0,
        data: new _customArrayView.CustomArrayView(buffer),
        mean: [
            0,
            0,
            0
        ],
        nodeOffset: event.data.offset,
        numPoints: event.data.buffer.byteLength / pointAttributes.byteSize,
        pointAttributes,
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
        version: new _version.Version(event.data.version)
    };
    for (const pointAttribute of ctx.pointAttributes.attributes){
        decodeAndAddAttribute(pointAttribute, ctx);
        ctx.currentOffset += pointAttribute.byteSize;
    }
    const indices = new ArrayBuffer(ctx.numPoints * 4);
    const iIndices = new Uint32Array(indices);
    for(let i = 0; i < ctx.numPoints; i++)iIndices[i] = i;
    if (!ctx.attributeBuffers[_pointAttributes.PointAttributeName.CLASSIFICATION]) addEmptyClassificationBuffer(ctx);
    const message = {
        buffer: buffer,
        mean: ctx.mean,
        attributeBuffers: ctx.attributeBuffers,
        tightBoundingBox: {
            min: ctx.tightBoxMin,
            max: ctx.tightBoxMax
        },
        indices
    };
    // console.log("old", message)
    postMessage(message, ctx.transferables);
}
function addEmptyClassificationBuffer(ctx) {
    const buffer = new ArrayBuffer(ctx.numPoints * 4);
    const classifications = new Float32Array(buffer);
    for(let i = 0; i < ctx.numPoints; i++)classifications[i] = 0;
    ctx.attributeBuffers[_pointAttributes.PointAttributeName.CLASSIFICATION] = {
        buffer,
        attribute: _pointAttributes.POINT_ATTRIBUTES.CLASSIFICATION
    };
}
function decodeAndAddAttribute(attribute, ctx) {
    const decodedAttribute = decodePointAttribute(attribute, ctx);
    if (decodedAttribute === undefined) return;
    ctx.attributeBuffers[decodedAttribute.attribute.name] = decodedAttribute;
    ctx.transferables.push(decodedAttribute.buffer);
}
function decodePointAttribute(attribute, ctx) {
    switch(attribute.name){
        case _pointAttributes.PointAttributeName.POSITION_CARTESIAN:
            return decodePositionCartesian(attribute, ctx);
        case _pointAttributes.PointAttributeName.COLOR_PACKED:
            return decodeColor(attribute, ctx);
        case _pointAttributes.PointAttributeName.INTENSITY:
            return decodeIntensity(attribute, ctx);
        case _pointAttributes.PointAttributeName.CLASSIFICATION:
            return decodeClassification(attribute, ctx);
        case _pointAttributes.PointAttributeName.NORMAL_SPHEREMAPPED:
            return decodeNormalSphereMapped(attribute, ctx);
        case _pointAttributes.PointAttributeName.NORMAL_OCT16:
            return decodeNormalOct16(attribute, ctx);
        case _pointAttributes.PointAttributeName.NORMAL:
            return decodeNormal(attribute, ctx);
        default:
            return undefined;
    }
}
function decodePositionCartesian(attribute, ctx) {
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
        buffer,
        attribute
    };
}
function decodeColor(attribute, ctx) {
    const buffer = new ArrayBuffer(ctx.numPoints * 3);
    const colors = new Uint8Array(buffer);
    for(let i = 0; i < ctx.numPoints; i++){
        colors[3 * i + 0] = ctx.data.getUint8(ctx.currentOffset + i * ctx.pointAttributes.byteSize + 0);
        colors[3 * i + 1] = ctx.data.getUint8(ctx.currentOffset + i * ctx.pointAttributes.byteSize + 1);
        colors[3 * i + 2] = ctx.data.getUint8(ctx.currentOffset + i * ctx.pointAttributes.byteSize + 2);
    }
    return {
        buffer,
        attribute
    };
}
function decodeIntensity(attribute, ctx) {
    const buffer = new ArrayBuffer(ctx.numPoints * 4);
    const intensities = new Float32Array(buffer);
    for(let i = 0; i < ctx.numPoints; i++)intensities[i] = ctx.data.getUint16(ctx.currentOffset + i * ctx.pointAttributes.byteSize);
    return {
        buffer,
        attribute
    };
}
function decodeClassification(attribute, ctx) {
    const buffer = new ArrayBuffer(ctx.numPoints);
    const classifications = new Uint8Array(buffer);
    for(let j = 0; j < ctx.numPoints; j++)classifications[j] = ctx.data.getUint8(ctx.currentOffset + j * ctx.pointAttributes.byteSize);
    return {
        buffer,
        attribute
    };
}
function decodeNormalSphereMapped(attribute, ctx) {
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
        buffer,
        attribute
    };
}
function decodeNormalOct16(attribute, ctx) {
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
            x = -(v / mathSign(v) - 1) / mathSign(u);
            y = -(u / mathSign(u) - 1) / mathSign(v);
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
        attribute
    };
}
function decodeNormal(attribute, ctx) {
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
        buffer,
        attribute
    };
}

},{"../point-attributes":"hfq6b","../version":"1JBAL","./custom-array-view":"gvyax","@parcel/transformer-js/src/esmodule-helpers.js":"fn8Fk"}],"hfq6b":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "PointAttributeName", ()=>PointAttributeName
);
parcelHelpers.export(exports, "POINT_ATTRIBUTE_TYPES", ()=>POINT_ATTRIBUTE_TYPES
);
parcelHelpers.export(exports, "POINT_ATTRIBUTES", ()=>POINT_ATTRIBUTES
);
parcelHelpers.export(exports, "PointAttributes", ()=>PointAttributes
);
var PointAttributeName;
(function(PointAttributeName1) {
    PointAttributeName1[PointAttributeName1["POSITION_CARTESIAN"] = 0] = "POSITION_CARTESIAN";
    PointAttributeName1[PointAttributeName1["COLOR_PACKED"] = 1] = "COLOR_PACKED";
    PointAttributeName1[PointAttributeName1["COLOR_FLOATS_1"] = 2] = "COLOR_FLOATS_1";
    PointAttributeName1[PointAttributeName1["COLOR_FLOATS_255"] = 3] = "COLOR_FLOATS_255";
    PointAttributeName1[PointAttributeName1["NORMAL_FLOATS"] = 4] = "NORMAL_FLOATS";
    PointAttributeName1[PointAttributeName1["FILLER"] = 5] = "FILLER";
    PointAttributeName1[PointAttributeName1["INTENSITY"] = 6] = "INTENSITY";
    PointAttributeName1[PointAttributeName1["CLASSIFICATION"] = 7] = "CLASSIFICATION";
    PointAttributeName1[PointAttributeName1["NORMAL_SPHEREMAPPED"] = 8] = "NORMAL_SPHEREMAPPED";
    PointAttributeName1[PointAttributeName1["NORMAL_OCT16"] = 9] = "NORMAL_OCT16";
    PointAttributeName1[PointAttributeName1["NORMAL"] = 10] = "NORMAL";
})(PointAttributeName || (PointAttributeName = {
}));
const POINT_ATTRIBUTE_TYPES = {
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
function makePointAttribute(name, type, numElements) {
    return {
        name,
        type,
        numElements,
        byteSize: numElements * type.size
    };
}
const RGBA_PACKED = makePointAttribute(PointAttributeName.COLOR_PACKED, POINT_ATTRIBUTE_TYPES.DATA_TYPE_INT8, 4);
const POINT_ATTRIBUTES = {
    POSITION_CARTESIAN: makePointAttribute(PointAttributeName.POSITION_CARTESIAN, POINT_ATTRIBUTE_TYPES.DATA_TYPE_FLOAT, 3),
    RGBA_PACKED,
    COLOR_PACKED: RGBA_PACKED,
    RGB_PACKED: makePointAttribute(PointAttributeName.COLOR_PACKED, POINT_ATTRIBUTE_TYPES.DATA_TYPE_INT8, 3),
    NORMAL_FLOATS: makePointAttribute(PointAttributeName.NORMAL_FLOATS, POINT_ATTRIBUTE_TYPES.DATA_TYPE_FLOAT, 3),
    FILLER_1B: makePointAttribute(PointAttributeName.FILLER, POINT_ATTRIBUTE_TYPES.DATA_TYPE_UINT8, 1),
    INTENSITY: makePointAttribute(PointAttributeName.INTENSITY, POINT_ATTRIBUTE_TYPES.DATA_TYPE_UINT16, 1),
    CLASSIFICATION: makePointAttribute(PointAttributeName.CLASSIFICATION, POINT_ATTRIBUTE_TYPES.DATA_TYPE_UINT8, 1),
    NORMAL_SPHEREMAPPED: makePointAttribute(PointAttributeName.NORMAL_SPHEREMAPPED, POINT_ATTRIBUTE_TYPES.DATA_TYPE_UINT8, 2),
    NORMAL_OCT16: makePointAttribute(PointAttributeName.NORMAL_OCT16, POINT_ATTRIBUTE_TYPES.DATA_TYPE_UINT8, 2),
    NORMAL: makePointAttribute(PointAttributeName.NORMAL, POINT_ATTRIBUTE_TYPES.DATA_TYPE_FLOAT, 3)
};
class PointAttributes {
    constructor(pointAttributeNames = []){
        this.attributes = [];
        this.byteSize = 0;
        this.size = 0;
        for(let i = 0; i < pointAttributeNames.length; i++){
            const pointAttributeName = pointAttributeNames[i];
            const pointAttribute = POINT_ATTRIBUTES[pointAttributeName];
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
        return this.attributes.find(isColorAttribute) !== undefined;
    }
    hasNormals() {
        return this.attributes.find(isNormalAttribute) !== undefined;
    }
}
function isColorAttribute({ name  }) {
    return name === PointAttributeName.COLOR_PACKED;
}
function isNormalAttribute({ name  }) {
    return name === PointAttributeName.NORMAL_SPHEREMAPPED || name === PointAttributeName.NORMAL_FLOATS || name === PointAttributeName.NORMAL || name === PointAttributeName.NORMAL_OCT16;
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

},{}],"1JBAL":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Version", ()=>Version
);
class Version {
    constructor(version){
        this.versionMinor = 0;
        this.version = version;
        const vmLength = version.indexOf('.') === -1 ? version.length : version.indexOf('.');
        this.versionMajor = parseInt(version.substr(0, vmLength), 10);
        this.versionMinor = parseInt(version.substr(vmLength + 1), 10);
        if (isNaN(this.versionMinor)) this.versionMinor = 0;
    }
    newerThan(version) {
        const v = new Version(version);
        if (this.versionMajor > v.versionMajor) return true;
        else if (this.versionMajor === v.versionMajor && this.versionMinor > v.versionMinor) return true;
        else return false;
    }
    equalOrHigher(version) {
        const v = new Version(version);
        if (this.versionMajor > v.versionMajor) return true;
        else if (this.versionMajor === v.versionMajor && this.versionMinor >= v.versionMinor) return true;
        else return false;
    }
    upTo(version) {
        return !this.newerThan(version);
    }
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"fn8Fk"}],"gvyax":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
/**
 * Adapted from Potree.js http://potree.org
 * Potree License: https://github.com/potree/potree/blob/1.5/LICENSE
 */ // http://jsperf.com/uint8array-vs-dataview3/3
// tslint:disable:no-bitwise
parcelHelpers.export(exports, "CustomArrayView", ()=>CustomArrayView
) // tslint:enable:no-bitwise
;
class CustomArrayView {
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
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"fn8Fk"}]},["hCCgf","lrQRU"], "lrQRU", "parcelRequirefa99")

//# sourceMappingURL=binary-decoder.worker.778111b1.js.map

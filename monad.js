"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Monad = /** @class */ (function () {
    function Monad() {
    }
    // tslint:enable ban-types
    Monad.$valueIsMapCallback = function (fn) {
        if (typeof fn === 'function' && fn.length === 1) {
            return true;
        }
        return false;
    };
    Monad.$valueIsPartialMapCallback = function (fn) {
        if (typeof fn === 'function' && fn.length === 1) {
            return true;
        }
        return false;
    };
    // tslint:disable-next-line:no-console
    Monad.prototype.inspect = function (f) {
        if (f === void 0) { f = console.log; }
        f(this.constructor.name + ":", this.$value);
        return this;
    };
    return Monad;
}());
exports.default = Monad;

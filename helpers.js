"use strict";
// TODO: replace anys with generics where possible in whole file
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.either = exports.reject = exports.nothing = exports.left = exports.prop = exports.chain = exports.ap = exports.map = exports.identity = exports.curry = exports.partial = exports.pipe = void 0;
var either_1 = require("./either");
var maybe_1 = __importDefault(require("./maybe"));
var task_1 = __importDefault(require("./task"));
// tslint:disable-next-line:ban-types
exports.pipe = function () {
    var fns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
    }
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return fns.reduce(function (res, f) { return [f.call.apply(f, __spreadArrays([null], res))]; }, args)[0];
    };
};
// tslint:disable-next-line:ban-types
exports.partial = function (f, firstArg) { return function () {
    var lastArgs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        lastArgs[_i] = arguments[_i];
    }
    return f.apply(void 0, __spreadArrays([firstArg], lastArgs));
}; };
/**
 * curry :: Function -> Function
 */
exports.curry = function (f) {
    var arity = f.length;
    return function $curry() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return args.length < arity
            ? $curry.bind.apply($curry, __spreadArrays([null], args)) : f.call.apply(f, __spreadArrays([null], args));
    };
};
exports.identity = function (x) { return x; };
exports.map = exports.curry(function (f, m) {
    return m.map(f);
});
exports.ap = exports.curry(function (f, m) {
    return m.ap(f);
});
exports.chain = exports.curry(function (f, m) {
    return m.chain(f);
});
exports.prop = exports.curry(function (x, y) { return y[x]; });
exports.left = function (a) { return new either_1.Left(a); };
exports.nothing = maybe_1.default.of(null);
exports.reject = function (a) { return task_1.default.rejected(a); };
exports.either = exports.curry(function (f, g, e) { return e.isLeft ? f(e.$value) : g(e.$value); });

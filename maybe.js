"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var monad_1 = __importDefault(require("./monad"));
var Maybe = /** @class */ (function (_super) {
    __extends(Maybe, _super);
    function Maybe($value) {
        var _this = _super.call(this) || this;
        _this.$value = $value;
        return _this;
    }
    Maybe.of = function ($value) {
        return new Maybe($value);
    };
    Object.defineProperty(Maybe.prototype, "isNothing", {
        get: function () {
            return this.$value != null;
        },
        enumerable: false,
        configurable: true
    });
    Maybe.prototype.chain = function (f) {
        return this.isNothing ? this : f(this.$value);
    };
    Maybe.prototype.map = function (f) {
        return this.isNothing ? this : Maybe.of(f(this.$value));
    };
    Maybe.prototype.ap = function (maybe) {
        if (monad_1.default.$valueIsMapCallback(this.$value)) {
            return this.isNothing ? this : maybe.map(this.$value);
        }
        throw TypeError('Maybe.$value is not a function');
    };
    Maybe.prototype.orElse = function (e) {
        return this.isNothing ? e : this.$value;
    };
    Maybe.prototype.fold = function (fa, fb) {
        return this.isNothing
            ? fa()
            : fb(this.$value);
    };
    Maybe.inspect = function (maybe) {
        if (maybe.isNothing) {
            console.log('Nothing');
        }
        else {
            console.log('Just: ', maybe.$value);
        }
        return maybe;
    };
    return Maybe;
}(monad_1.default));
exports.default = Maybe;

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
var List = /** @class */ (function (_super) {
    __extends(List, _super);
    function List($value) {
        var _this = _super.call(this) || this;
        _this.$value = $value;
        return _this;
    }
    List.of = function ($value) {
        return new List([$value]);
    };
    List.prototype.concat = function (x) {
        return new List(this.$value.concat(x));
    };
    List.prototype.map = function (f) {
        return new List(this.$value.map(f));
    };
    List.prototype.ap = function () {
        throw new Error('Not implemented: List.ap()');
    };
    List.prototype.chain = function (f) {
        return this.$value.map(f);
    };
    return List;
}(monad_1.default));
exports.default = List;

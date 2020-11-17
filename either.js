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
exports.Right = exports.Left = void 0;
var monad_1 = __importDefault(require("./monad"));
var Either = /** @class */ (function (_super) {
    __extends(Either, _super);
    function Either($value) {
        var _this = _super.call(this) || this;
        _this.$value = $value;
        return _this;
    }
    Either.of = function (b) {
        return new Right(b);
    };
    Either.isLeft = function (either) {
        return either.isLeft;
    };
    Either.tryCatch = function (fa, fb) {
        try {
            return Either.of(fa());
        }
        catch (err) {
            return new Left(fb(err));
        }
    };
    Either.fold = function (fa, fb, e) {
        return e instanceof Left
            ? fa(e.$value)
            : fb(e.$value);
    };
    Object.defineProperty(Either.prototype, "value", {
        get: function () {
            return this.$value;
        },
        enumerable: false,
        configurable: true
    });
    return Either;
}(monad_1.default));
exports.default = Either;
var Left = /** @class */ (function (_super) {
    __extends(Left, _super);
    function Left($value) {
        return _super.call(this, $value) || this;
        // this.$value = x
    }
    Left.of = function () {
        throw new Error('Cannot call "Left.of()", use "Either.of()" instead');
    };
    Object.defineProperty(Left.prototype, "isLeft", {
        get: function () {
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Left.prototype, "isRight", {
        get: function () {
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Left.prototype.map = function (_) {
        return this;
    };
    Left.prototype.ap = function (_) {
        return this;
    };
    Left.prototype.chain = function (_) {
        return this;
    };
    return Left;
}(Either));
exports.Left = Left;
var Right = /** @class */ (function (_super) {
    __extends(Right, _super);
    function Right($value) {
        return _super.call(this, $value) || this;
        // this.$value = x
    }
    Right.of = function () {
        throw new Error('Cannot call "Right.of()", use "Either.of()" instead');
    };
    Object.defineProperty(Right.prototype, "isLeft", {
        get: function () {
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Right.prototype, "isRight", {
        get: function () {
            return true;
        },
        enumerable: false,
        configurable: true
    });
    // XXX: validate R1 = R
    Right.prototype.map = function (f) {
        return Either.of(f(this.$value));
    };
    Right.prototype.ap = function (right) {
        if (monad_1.default.$valueIsMapCallback(this.$value)) {
            return right.map(this.$value);
        }
        throw new TypeError('Either.$value is not a function');
    };
    Right.prototype.chain = function (f) {
        return f(this.$value);
    };
    return Right;
}(Either));
exports.Right = Right;

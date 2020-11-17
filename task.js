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
var Task = /** @class */ (function (_super) {
    __extends(Task, _super);
    function Task(computation, cleanup) {
        var _this = _super.call(this) || this;
        _this.fork = computation;
        _this.cleanup = cleanup || (function () { return undefined; });
        return _this;
    }
    Task.of = function (b) {
        var taskDefault = function (_, resolve) { return resolve(b); };
        return new Task(taskDefault);
    };
    Task.rejected = function (a) {
        return new Task(function (reject) { return reject(a); });
    };
    Task.fromPromise = function (promise) {
        return new Task(function (reject, resolve) { return promise.then(resolve).catch(reject); });
    };
    Task.prototype.run = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return _this.fork(reject, resolve); });
    };
    /**
     * Returns a task that will never resolve
     */
    Task.prototype.empty = function () {
        return new Task(function () { return undefined; });
    };
    /**
     * Transforms a failure value into a new Task[a, b]. Does nothing if the
     * structure already contains a successful value.
     */
    Task.prototype.orElse = function (f) {
        var fork = this.fork;
        var cleanup = this.cleanup;
        return new Task(function (reject, resolve) { return fork(function (a) { return f(a).fork(reject, resolve); }, resolve); }, cleanup);
    };
    /**
     * Takes two functions, applies the leftmost one to the failure value
     * and the rightmost one to the successful value depending on which
     * one is present
     */
    Task.prototype.fold = function (fa, fb) {
        var fork = this.fork;
        var cleanup = this.cleanup;
        return new Task(function (_, resolve) { return fork(function (a) { return resolve(fa(a)); }, function (b) { return resolve(fb(b)); }); }, cleanup);
    };
    /**
     * Transforms the successful value of the task
     * using a regular unary function
     */
    Task.prototype.map = function (f) {
        var fork = this.fork;
        var cleanup = this.cleanup;
        return new Task(function (reject, resolve) { return fork(reject, function (b) { return resolve(f(b)); }); }, cleanup);
    };
    /**
     * Apply the successful value of one task to another
     */
    Task.prototype.ap = function (task) {
        return this.chain(task.map);
    };
    /**
     * Transforms the successful value of the task
     * using a function to a monad
     */
    Task.prototype.chain = function (f) {
        var fork = this.fork;
        var cleanup = this.cleanup;
        return new Task(function (reject, resolve) { return fork(reject, function (b) {
            if (monad_1.default.$valueIsPartialMapCallback(b)) {
                f(b).fork(reject, resolve);
            }
            throw new TypeError('The value passed to resolve is not a function');
        }); }, cleanup);
    };
    return Task;
}(monad_1.default));
exports.default = Task;

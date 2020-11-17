"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeItem = exports.setItem = exports.getItem = void 0;
var either_1 = __importDefault(require("./either"));
var helpers_1 = require("./helpers");
/**
 * Pure version of localStorage.getItem that won't throw
 *
 * @param key localStorage property to retrieve
 * @returns Either error deserialized value
 */
exports.getItem = function (key) {
    return either_1.default.tryCatch(function () { return helpers_1.pipe(localStorage.getItem.bind(localStorage), String, JSON.parse.bind(JSON))(key); }, function (reason) { return new Error(String(reason)); });
};
/**
 * Curried, pure version of localStorage.setItem that won't throw
 *
 * @Remarks curried
 * @param key localStorage property to set
 * @param value value to serialize and write to localStorage
 * @returns Either error or null
 */
exports.setItem = helpers_1.curry(function (key, value) {
    return either_1.default.tryCatch(function () {
        var writeToLS = helpers_1.partial(localStorage.setItem.bind(localStorage), [key]);
        helpers_1.pipe(JSON.stringify.bind(JSON), writeToLS)(value);
        return null;
    }, function (reason) { return new Error(String(reason)); });
});
/**
 * Pure version of localStorage.removeItem that won't throw
 *
 * @param key localStorage property to remove
 * @returns Either error or void
 */
exports.removeItem = function (key) {
    return either_1.default.tryCatch(function () { return localStorage.removeItem.bind(localStorage)(key); }, function (reason) { return new Error(String(reason)); });
};

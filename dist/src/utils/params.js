"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueryAsDate = exports.getQueryAsBoolean = exports.getQueryAsNumber = exports.getQueryAsString = exports.getParamAsString = void 0;
// Helper function to safely get a single string from a parameter that could be string | string[]
const getParamAsString = (param) => {
    if (Array.isArray(param)) {
        return param[0] || "";
    }
    return param || "";
};
exports.getParamAsString = getParamAsString;
// Helper function to parse query parameter as string
const getQueryAsString = (query) => {
    if (typeof query === "string") {
        return query;
    }
    if (Array.isArray(query) && typeof query[0] === "string") {
        return query[0];
    }
    return undefined;
};
exports.getQueryAsString = getQueryAsString;
// Helper function to parse query parameter as number
const getQueryAsNumber = (query) => {
    const str = (0, exports.getQueryAsString)(query);
    if (str === undefined)
        return undefined;
    const num = parseFloat(str);
    return isNaN(num) ? undefined : num;
};
exports.getQueryAsNumber = getQueryAsNumber;
// Helper function to parse query parameter as boolean
const getQueryAsBoolean = (query) => {
    const str = (0, exports.getQueryAsString)(query);
    if (str === undefined)
        return undefined;
    return str === "true";
};
exports.getQueryAsBoolean = getQueryAsBoolean;
// Helper function to parse query parameter as Date
const getQueryAsDate = (query) => {
    const str = (0, exports.getQueryAsString)(query);
    if (str === undefined)
        return undefined;
    const date = new Date(str);
    return isNaN(date.getTime()) ? undefined : date;
};
exports.getQueryAsDate = getQueryAsDate;

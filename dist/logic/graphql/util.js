"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asList = void 0;
// GraphQL inserts a null as the first element of an input.
// This is a ridiculous conversion.
const asList = (list) => JSON.parse(JSON.stringify(list));
exports.asList = asList;
//# sourceMappingURL=util.js.map
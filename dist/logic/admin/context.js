"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.empty = void 0;
const empty = (request, response) => {
    return {
        id: response.locals.id,
        pool: request.app.locals.db
    };
};
exports.empty = empty;
//# sourceMappingURL=context.js.map
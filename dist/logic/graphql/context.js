"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.empty = void 0;
const user_1 = require("../user");
const empty = (request, response) => {
    return {
        id: response.locals.id,
        pool: request.app.locals.db,
        plaidClient: request.app.locals.plaidClient,
        arena: user_1.UserArena.empty(response.locals.user)
    };
};
exports.empty = empty;
//# sourceMappingURL=context.js.map
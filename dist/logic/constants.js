"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_PORT = exports.SCHEDULER_PORT = exports.ENGINE_HOST = exports.SCHEDULER_HOST = exports.VIRTUAL_ACCOUNT = exports.PHYSICAL_ACCOUNT = exports.GLOBAL_ACCOUNT = void 0;
exports.GLOBAL_ACCOUNT = "Global";
exports.PHYSICAL_ACCOUNT = "Physical";
exports.VIRTUAL_ACCOUNT = "Virtual";
exports.SCHEDULER_HOST = process.env.PRODUCTION ? "scheduler" : "localhost";
exports.ENGINE_HOST = process.env.PRODUCTION ? "engine" : "localhost";
exports.SCHEDULER_PORT = "3002";
exports.ENGINE_PORT = "3000";
//# sourceMappingURL=constants.js.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineChannel = void 0;
const O = __importStar(require("fp-ts/Option"));
const constants_1 = require("../constants");
const magic_1 = require("../../magic");
var EngineChannel;
(function (EngineChannel) {
    const host = constants_1.ENGINE_HOST;
    const port = constants_1.ENGINE_PORT;
    EngineChannel.push = (uri) => (method) => (body = O.none) => {
        return magic_1.Channel.push(host)(port)(`/channel${uri}`)(method)(body);
    };
})(EngineChannel = exports.EngineChannel || (exports.EngineChannel = {}));
exports.default = EngineChannel;
//# sourceMappingURL=engine-channel.js.map
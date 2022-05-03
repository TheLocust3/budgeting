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
exports.External = void 0;
const iot = __importStar(require("io-ts"));
const magic_1 = require("../magic");
var External;
(function (External) {
    let Request;
    (function (Request) {
        let ExchangePublicToken;
        (function (ExchangePublicToken) {
            const Account = iot.type({
                id: iot.string,
                name: iot.string
            });
            const t = iot.type({
                publicToken: iot.string,
                accounts: iot.array(Account),
                institutionName: iot.string
            });
            ExchangePublicToken.Json = new magic_1.Format.JsonFormatter(t);
        })(ExchangePublicToken = Request.ExchangePublicToken || (Request.ExchangePublicToken = {}));
    })(Request = External.Request || (External.Request = {}));
    let Response;
    (function (Response) {
        let CreateLinkToken;
        (function (CreateLinkToken) {
            const t = iot.type({
                token: iot.string
            });
            CreateLinkToken.Json = new magic_1.Format.JsonFormatter(t);
        })(CreateLinkToken = Response.CreateLinkToken || (Response.CreateLinkToken = {}));
    })(Response = External.Response || (External.Response = {}));
})(External = exports.External || (exports.External = {}));
//# sourceMappingURL=plaid.js.map
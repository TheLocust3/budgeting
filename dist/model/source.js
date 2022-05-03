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
exports.External = exports.Channel = exports.Frontend = exports.Internal = void 0;
const pipeable_1 = require("fp-ts/lib/pipeable");
const E = __importStar(require("fp-ts/Either"));
const iot = __importStar(require("io-ts"));
const types = __importStar(require("io-ts-types"));
const magic_1 = require("../magic");
var Internal;
(function (Internal) {
    Internal.t = iot.type({
        id: iot.string,
        userId: iot.string,
        name: iot.string,
        integrationId: types.option(iot.string),
        tag: iot.string,
        createdAt: types.DateFromISOString
    });
    Internal.Json = new magic_1.Format.JsonFormatter(Internal.t);
    Internal.Database = new class {
        constructor() {
            this.TableType = iot.type({
                id: iot.string,
                user_id: iot.string,
                name: iot.string,
                integration_id: types.optionFromNullable(iot.string),
                tag: iot.string,
                created_at: types.date
            });
            this.from = (obj) => {
                return (0, pipeable_1.pipe)(obj, this.TableType.decode, E.mapLeft((_) => magic_1.Exception.throwInternalError), E.map(({ id, user_id, name, integration_id, created_at, tag }) => {
                    return { id: id, userId: user_id, name: name, integrationId: integration_id, tag: tag, createdAt: created_at };
                }));
            };
            this.to = (obj) => {
                return {
                    id: obj.id,
                    user_id: obj.userId,
                    name: obj.name,
                    integration_id: obj.integrationId,
                    tag: obj.tag,
                    created_at: obj.createdAt
                };
            };
        }
    };
})(Internal = exports.Internal || (exports.Internal = {}));
var Frontend;
(function (Frontend) {
    let Create;
    (function (Create) {
        const t = iot.type({
            userId: iot.string,
            name: iot.string,
            integrationId: types.option(iot.string),
            tag: iot.string
        });
        Create.Json = new magic_1.Format.JsonFormatter(t);
    })(Create = Frontend.Create || (Frontend.Create = {}));
})(Frontend = exports.Frontend || (exports.Frontend = {}));
var Channel;
(function (Channel) {
    let Request;
    (function (Request) {
        let Create;
        (function (Create) {
            const t = iot.type({
                userId: iot.string,
                name: iot.string,
                integrationId: types.option(iot.string)
            });
            Create.Json = new magic_1.Format.JsonFormatter(t);
        })(Create = Request.Create || (Request.Create = {}));
    })(Request = Channel.Request || (Channel.Request = {}));
})(Channel = exports.Channel || (exports.Channel = {}));
var External;
(function (External) {
    let Request;
    (function (Request) {
        let Create;
        (function (Create) {
            const t = iot.type({
                name: iot.string,
                integrationId: types.option(iot.string)
            });
            Create.Json = new magic_1.Format.JsonFormatter(t);
        })(Create = Request.Create || (Request.Create = {}));
    })(Request = External.Request || (External.Request = {}));
    let Response;
    (function (Response) {
        let SourceList;
        (function (SourceList) {
            const t = iot.type({
                sources: iot.array(Internal.t)
            });
            SourceList.Json = new magic_1.Format.JsonFormatter(t);
        })(SourceList = Response.SourceList || (Response.SourceList = {}));
    })(Response = External.Response || (External.Response = {}));
})(External = exports.External || (exports.External = {}));
//# sourceMappingURL=source.js.map
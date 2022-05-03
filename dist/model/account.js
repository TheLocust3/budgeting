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
exports.Channel = exports.Frontend = exports.Internal = void 0;
const pipeable_1 = require("fp-ts/lib/pipeable");
const E = __importStar(require("fp-ts/Either"));
const iot = __importStar(require("io-ts"));
const types = __importStar(require("io-ts-types"));
const Rule = __importStar(require("./rule"));
const magic_1 = require("../magic");
var Internal;
(function (Internal) {
    Internal.t = iot.type({
        id: iot.string,
        parentId: types.option(iot.string),
        userId: iot.string,
        name: iot.string
    });
    const WithChildren = iot.type({
        children: iot.array(iot.string)
    });
    const WithRules = iot.type({
        rules: iot.array(Rule.Internal.t)
    });
    Internal.Json = new magic_1.Format.JsonFormatter(Internal.t);
    Internal.Database = new class {
        constructor() {
            this.TableType = iot.type({
                id: iot.string,
                parent_id: types.optionFromNullable(iot.string),
                user_id: iot.string,
                name: iot.string
            });
            this.from = (obj) => {
                return (0, pipeable_1.pipe)(obj, this.TableType.decode, E.mapLeft((_) => magic_1.Exception.throwInternalError), E.map(({ id, parent_id, user_id, name }) => {
                    return { id: id, parentId: parent_id, userId: user_id, name: name };
                }));
            };
            this.to = (obj) => {
                return {
                    id: obj.id,
                    parent_id: obj.parentId,
                    user_id: obj.userId,
                    name: obj.name
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
            parentId: types.option(iot.string),
            userId: iot.string,
            name: iot.string
        });
        Create.Json = new magic_1.Format.JsonFormatter(t);
    })(Create = Frontend.Create || (Frontend.Create = {}));
})(Frontend = exports.Frontend || (exports.Frontend = {}));
var Channel;
(function (Channel) {
    let Query;
    (function (Query) {
        const t = iot.type({
            userId: iot.string
        });
        Query.Json = new magic_1.Format.JsonFormatter(t);
    })(Query = Channel.Query || (Channel.Query = {}));
    let Response;
    (function (Response) {
        let AccountList;
        (function (AccountList) {
            const t = iot.type({
                accounts: iot.array(Internal.t)
            });
            AccountList.Json = new magic_1.Format.JsonFormatter(t);
        })(AccountList = Response.AccountList || (Response.AccountList = {}));
    })(Response = Channel.Response || (Channel.Response = {}));
})(Channel = exports.Channel || (exports.Channel = {}));
//# sourceMappingURL=account.js.map
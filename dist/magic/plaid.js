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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangePublicToken = exports.createLinkToken = exports.getAccounts = exports.getTransactions = void 0;
const plaid_1 = require("plaid");
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const moment_1 = __importDefault(require("moment"));
const index_1 = require("./index");
const pull = (plaidClient) => (accessToken, startDate, endDate) => {
    return TE.tryCatch(async () => {
        const response = await plaidClient.transactionsGet({
            access_token: accessToken,
            start_date: (0, moment_1.default)(startDate).format("YYYY-MM-DD"),
            end_date: (0, moment_1.default)(endDate).format("YYYY-MM-DD")
        });
        return response.data;
    }, E.toError);
};
const getTransactions = (plaidClient) => (accessToken, startDate, endDate) => {
    return (0, pipeable_1.pipe)(pull(plaidClient)(accessToken, startDate, endDate), TE.map((response) => response.transactions));
};
exports.getTransactions = getTransactions;
const getAccounts = (plaidClient) => (accessToken, startDate, endDate) => {
    return (0, pipeable_1.pipe)(pull(plaidClient)(accessToken, startDate, endDate), TE.map((response) => response.accounts));
};
exports.getAccounts = getAccounts;
const createLinkToken = (plaidClient) => (userId) => {
    const req = {
        user: { client_user_id: userId },
        client_name: "Budgeting",
        products: [plaid_1.Products.Transactions],
        language: 'en',
        country_codes: [plaid_1.CountryCode.Us],
    };
    return (0, pipeable_1.pipe)(TE.tryCatch(() => plaidClient.linkTokenCreate(req), (_) => index_1.Exception.throwInternalError), TE.map((response) => response.data.link_token));
};
exports.createLinkToken = createLinkToken;
const exchangePublicToken = (plaidClient) => (publicToken) => {
    return (0, pipeable_1.pipe)(TE.tryCatch(() => plaidClient.itemPublicTokenExchange({ public_token: publicToken }), (_) => index_1.Exception.throwInternalError), TE.map((response) => response.data));
};
exports.exchangePublicToken = exchangePublicToken;
//# sourceMappingURL=plaid.js.map
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";
import * as Rule from "./rule";
import { Exception, Format } from "../magic";
export declare namespace Internal {
    export const t: iot.TypeC<{
        id: iot.StringC;
        parentId: types.OptionC<iot.StringC>;
        userId: iot.StringC;
        name: iot.StringC;
    }>;
    export type t = iot.TypeOf<typeof t>;
    const WithChildren: iot.TypeC<{
        children: iot.ArrayC<iot.StringC>;
    }>;
    export type WithChildren = iot.TypeOf<typeof WithChildren>;
    const WithRules: iot.TypeC<{
        rules: iot.ArrayC<iot.TypeC<{
            id: iot.StringC;
            accountId: iot.StringC;
            userId: iot.StringC;
            rule: iot.UnionC<[iot.TypeC<{
                _type: iot.LiteralC<"Attach">;
                where: iot.RecursiveType<iot.Type<Rule.Internal.Clause.t, Rule.Internal.Clause.t, unknown>, Rule.Internal.Clause.t, Rule.Internal.Clause.t, unknown>;
                field: iot.StringC;
                value: iot.StringC;
            }>, iot.UnionC<[iot.TypeC<{
                _type: iot.LiteralC<"SplitByPercent">;
                where: iot.RecursiveType<iot.Type<Rule.Internal.Clause.t, Rule.Internal.Clause.t, unknown>, Rule.Internal.Clause.t, Rule.Internal.Clause.t, unknown>;
                splits: iot.ArrayC<iot.TypeC<{
                    _type: iot.LiteralC<"Percent">;
                    account: iot.StringC;
                    percent: iot.NumberC;
                }>>;
            }>, iot.TypeC<{
                _type: iot.LiteralC<"SplitByValue">;
                where: iot.RecursiveType<iot.Type<Rule.Internal.Clause.t, Rule.Internal.Clause.t, unknown>, Rule.Internal.Clause.t, Rule.Internal.Clause.t, unknown>;
                splits: iot.ArrayC<iot.TypeC<{
                    _type: iot.LiteralC<"Value">;
                    account: iot.StringC;
                    value: iot.NumberC;
                }>>;
                remainder: iot.StringC;
            }>]>, iot.TypeC<{
                _type: iot.LiteralC<"Include">;
                where: iot.RecursiveType<iot.Type<Rule.Internal.Clause.t, Rule.Internal.Clause.t, unknown>, Rule.Internal.Clause.t, Rule.Internal.Clause.t, unknown>;
            }>]>;
        }>>;
    }>;
    export type WithRules = iot.TypeOf<typeof WithRules>;
    export type Rich = t & WithChildren & WithRules;
    export const Json: Format.JsonFormatter<{
        id: string;
        parentId: O.Option<string>;
        userId: string;
        name: string;
    }>;
    export const Database: {
        TableType: iot.TypeC<{
            id: iot.StringC;
            parent_id: types.OptionFromNullableC<iot.StringC>;
            user_id: iot.StringC;
            name: iot.StringC;
        }>;
        from: (obj: any) => E.Either<Exception.t, t>;
        to: (obj: t) => any;
    };
    export {};
}
export declare namespace Frontend {
    namespace Create {
        const t: iot.TypeC<{
            parentId: types.OptionC<iot.StringC>;
            userId: iot.StringC;
            name: iot.StringC;
        }>;
        export type t = iot.TypeOf<typeof t>;
        export const Json: Format.JsonFormatter<{
            parentId: O.Option<string>;
            userId: string;
            name: string;
        }>;
        export {};
    }
}
export declare namespace Channel {
    namespace Query {
        const t: iot.TypeC<{
            userId: iot.StringC;
        }>;
        export type t = iot.TypeOf<typeof t>;
        export const Json: Format.JsonFormatter<{
            userId: string;
        }>;
        export {};
    }
    namespace Response {
        namespace AccountList {
            const t: iot.TypeC<{
                accounts: iot.ArrayC<iot.TypeC<{
                    id: iot.StringC;
                    parentId: types.OptionC<iot.StringC>;
                    userId: iot.StringC;
                    name: iot.StringC;
                }>>;
            }>;
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                accounts: {
                    id: string;
                    parentId: O.Option<string>;
                    userId: string;
                    name: string;
                }[];
            }>;
            export {};
        }
    }
}

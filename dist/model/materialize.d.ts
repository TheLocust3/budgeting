import * as O from "fp-ts/Option";
import * as iot from "io-ts";
import * as types from "io-ts-types";
import * as Rule from "./rule";
import { Format } from "../magic";
export declare namespace Internal {
    const Conflict: iot.TypeC<{
        element: iot.TypeC<{
            id: iot.StringC;
            sourceId: iot.StringC;
            userId: iot.StringC;
            amount: iot.NumberC;
            merchantName: iot.StringC;
            description: iot.StringC;
            authorizedAt: types.DateFromISOStringC;
            capturedAt: types.OptionC<types.DateFromISOStringC>;
            metadata: iot.ObjectC;
            custom: iot.RecordC<iot.StringC, iot.ArrayC<iot.StringC>>;
        }>;
        rules: iot.ArrayC<iot.UnionC<[iot.TypeC<{
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
        }>]>>;
    }>;
    type Conflict = iot.TypeOf<typeof Conflict>;
    const t: iot.TypeC<{
        conflicts: iot.ArrayC<iot.TypeC<{
            element: iot.TypeC<{
                id: iot.StringC;
                sourceId: iot.StringC;
                userId: iot.StringC;
                amount: iot.NumberC;
                merchantName: iot.StringC;
                description: iot.StringC;
                authorizedAt: types.DateFromISOStringC;
                capturedAt: types.OptionC<types.DateFromISOStringC>;
                metadata: iot.ObjectC;
                custom: iot.RecordC<iot.StringC, iot.ArrayC<iot.StringC>>;
            }>;
            rules: iot.ArrayC<iot.UnionC<[iot.TypeC<{
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
            }>]>>;
        }>>;
        tagged: iot.RecordC<iot.StringC, iot.ArrayC<iot.TypeC<{
            id: iot.StringC;
            sourceId: iot.StringC;
            userId: iot.StringC;
            amount: iot.NumberC;
            merchantName: iot.StringC;
            description: iot.StringC;
            authorizedAt: types.DateFromISOStringC;
            capturedAt: types.OptionC<types.DateFromISOStringC>;
            metadata: iot.ObjectC;
            custom: iot.RecordC<iot.StringC, iot.ArrayC<iot.StringC>>;
        }>>>;
        untagged: iot.ArrayC<iot.TypeC<{
            id: iot.StringC;
            sourceId: iot.StringC;
            userId: iot.StringC;
            amount: iot.NumberC;
            merchantName: iot.StringC;
            description: iot.StringC;
            authorizedAt: types.DateFromISOStringC;
            capturedAt: types.OptionC<types.DateFromISOStringC>;
            metadata: iot.ObjectC;
            custom: iot.RecordC<iot.StringC, iot.ArrayC<iot.StringC>>;
        }>>;
    }>;
    type t = iot.TypeOf<typeof t>;
    const Json: Format.JsonFormatter<{
        conflicts: {
            element: {
                id: string;
                sourceId: string;
                userId: string;
                amount: number;
                merchantName: string;
                description: string;
                authorizedAt: Date;
                capturedAt: O.Option<Date>;
                metadata: object;
                custom: {
                    [x: string]: string[];
                };
            };
            rules: ({
                _type: "SplitByPercent";
                where: Rule.Internal.Clause.t;
                splits: {
                    _type: "Percent";
                    account: string;
                    percent: number;
                }[];
            } | {
                _type: "SplitByValue";
                where: Rule.Internal.Clause.t;
                splits: {
                    _type: "Value";
                    account: string;
                    value: number;
                }[];
                remainder: string;
            } | {
                _type: "Attach";
                where: Rule.Internal.Clause.t;
                field: string;
                value: string;
            } | {
                _type: "Include";
                where: Rule.Internal.Clause.t;
            })[];
        }[];
        tagged: {
            [x: string]: {
                id: string;
                sourceId: string;
                userId: string;
                amount: number;
                merchantName: string;
                description: string;
                authorizedAt: Date;
                capturedAt: O.Option<Date>;
                metadata: object;
                custom: {
                    [x: string]: string[];
                };
            }[];
        };
        untagged: {
            id: string;
            sourceId: string;
            userId: string;
            amount: number;
            merchantName: string;
            description: string;
            authorizedAt: Date;
            capturedAt: O.Option<Date>;
            metadata: object;
            custom: {
                [x: string]: string[];
            };
        }[];
    }>;
}

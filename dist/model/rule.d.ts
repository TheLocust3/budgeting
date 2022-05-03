import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as Transaction from "./transaction";
import { Exception, Format } from "../magic";
export declare namespace Internal {
    namespace Clause {
        type StringOperator = "Eq" | "Neq";
        const StringOperator: iot.UnionC<[iot.LiteralC<"Eq">, iot.LiteralC<"Neq">]>;
        type NumberOperator = "Eq" | "Neq" | "Gt" | "Lt" | "Gte" | "Lte";
        const NumberOperator: iot.UnionC<[iot.LiteralC<"Eq">, iot.LiteralC<"Neq">, iot.LiteralC<"Gt">, iot.LiteralC<"Lt">, iot.LiteralC<"Gte">, iot.LiteralC<"Lte">]>;
        type Operator = StringOperator | NumberOperator;
        const Operator: iot.UnionC<[iot.UnionC<[iot.LiteralC<"Eq">, iot.LiteralC<"Neq">]>, iot.UnionC<[iot.LiteralC<"Eq">, iot.LiteralC<"Neq">, iot.LiteralC<"Gt">, iot.LiteralC<"Lt">, iot.LiteralC<"Gte">, iot.LiteralC<"Lte">]>]>;
        type And = {
            _type: "And";
            left: t;
            right: t;
        };
        const And: iot.Type<And>;
        type Not = {
            _type: "Not";
            clause: t;
        };
        const Not: iot.Type<Not>;
        type StringMatch = {
            _type: "StringMatch";
            field: Transaction.Internal.Field.StringField;
            operator: StringOperator;
            value: string;
        };
        const StringMatch: iot.Type<StringMatch>;
        type NumberMatch = {
            _type: "NumberMatch";
            field: Transaction.Internal.Field.NumberField;
            operator: NumberOperator;
            value: number;
        };
        const NumberMatch: iot.Type<NumberMatch>;
        type Exists = {
            _type: "Exists";
            field: Transaction.Internal.Field.OptionNumberField;
        };
        const Exists: iot.Type<Exists>;
        type StringGlob = {
            _type: "StringGlob";
            field: Transaction.Internal.Field.StringField;
            value: string;
        };
        const StringGlob: iot.Type<StringGlob>;
        type t = And | Not | StringMatch | NumberMatch | Exists | StringGlob;
        const t: iot.RecursiveType<iot.Type<t, t, unknown>, t, t, unknown>;
    }
    namespace Attach {
        type t = {
            _type: "Attach";
            where: Clause.t;
            field: string;
            value: string;
        };
        const t: iot.TypeC<{
            _type: iot.LiteralC<"Attach">;
            where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
            field: iot.StringC;
            value: iot.StringC;
        }>;
    }
    namespace Split {
        type Percent = {
            _type: "Percent";
            account: string;
            percent: number;
        };
        const Percent: iot.TypeC<{
            _type: iot.LiteralC<"Percent">;
            account: iot.StringC;
            percent: iot.NumberC;
        }>;
        type Value = {
            _type: "Value";
            account: string;
            value: number;
        };
        const Value: iot.TypeC<{
            _type: iot.LiteralC<"Value">;
            account: iot.StringC;
            value: iot.NumberC;
        }>;
        type SplitByPercent = {
            _type: "SplitByPercent";
            where: Clause.t;
            splits: Percent[];
        };
        const SplitByPercent: iot.TypeC<{
            _type: iot.LiteralC<"SplitByPercent">;
            where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
            splits: iot.ArrayC<iot.TypeC<{
                _type: iot.LiteralC<"Percent">;
                account: iot.StringC;
                percent: iot.NumberC;
            }>>;
        }>;
        type SplitByValue = {
            _type: "SplitByValue";
            where: Clause.t;
            splits: Value[];
            remainder: string;
        };
        const SplitByValue: iot.TypeC<{
            _type: iot.LiteralC<"SplitByValue">;
            where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
            splits: iot.ArrayC<iot.TypeC<{
                _type: iot.LiteralC<"Value">;
                account: iot.StringC;
                value: iot.NumberC;
            }>>;
            remainder: iot.StringC;
        }>;
        type t = SplitByPercent | SplitByValue;
        const t: iot.UnionC<[iot.TypeC<{
            _type: iot.LiteralC<"SplitByPercent">;
            where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
            splits: iot.ArrayC<iot.TypeC<{
                _type: iot.LiteralC<"Percent">;
                account: iot.StringC;
                percent: iot.NumberC;
            }>>;
        }>, iot.TypeC<{
            _type: iot.LiteralC<"SplitByValue">;
            where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
            splits: iot.ArrayC<iot.TypeC<{
                _type: iot.LiteralC<"Value">;
                account: iot.StringC;
                value: iot.NumberC;
            }>>;
            remainder: iot.StringC;
        }>]>;
    }
    namespace Include {
        type t = {
            _type: "Include";
            where: Clause.t;
        };
        const t: iot.TypeC<{
            _type: iot.LiteralC<"Include">;
            where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
        }>;
    }
    type Rule = Attach.t | Split.t | Include.t;
    const Rule: iot.UnionC<[iot.TypeC<{
        _type: iot.LiteralC<"Attach">;
        where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
        field: iot.StringC;
        value: iot.StringC;
    }>, iot.UnionC<[iot.TypeC<{
        _type: iot.LiteralC<"SplitByPercent">;
        where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
        splits: iot.ArrayC<iot.TypeC<{
            _type: iot.LiteralC<"Percent">;
            account: iot.StringC;
            percent: iot.NumberC;
        }>>;
    }>, iot.TypeC<{
        _type: iot.LiteralC<"SplitByValue">;
        where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
        splits: iot.ArrayC<iot.TypeC<{
            _type: iot.LiteralC<"Value">;
            account: iot.StringC;
            value: iot.NumberC;
        }>>;
        remainder: iot.StringC;
    }>]>, iot.TypeC<{
        _type: iot.LiteralC<"Include">;
        where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
    }>]>;
    const collectAttach: (rule: Rule) => O.Option<Attach.t>;
    const collectSplit: (rule: Rule) => O.Option<Split.t>;
    const collectInclude: (rule: Rule) => O.Option<Include.t>;
    const t: iot.TypeC<{
        id: iot.StringC;
        accountId: iot.StringC;
        userId: iot.StringC;
        rule: iot.UnionC<[iot.TypeC<{
            _type: iot.LiteralC<"Attach">;
            where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
            field: iot.StringC;
            value: iot.StringC;
        }>, iot.UnionC<[iot.TypeC<{
            _type: iot.LiteralC<"SplitByPercent">;
            where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
            splits: iot.ArrayC<iot.TypeC<{
                _type: iot.LiteralC<"Percent">;
                account: iot.StringC;
                percent: iot.NumberC;
            }>>;
        }>, iot.TypeC<{
            _type: iot.LiteralC<"SplitByValue">;
            where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
            splits: iot.ArrayC<iot.TypeC<{
                _type: iot.LiteralC<"Value">;
                account: iot.StringC;
                value: iot.NumberC;
            }>>;
            remainder: iot.StringC;
        }>]>, iot.TypeC<{
            _type: iot.LiteralC<"Include">;
            where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
        }>]>;
    }>;
    type t = iot.TypeOf<typeof t>;
    const Json: Format.JsonFormatter<{
        id: string;
        accountId: string;
        userId: string;
        rule: {
            _type: "SplitByPercent";
            where: Clause.t;
            splits: {
                _type: "Percent";
                account: string;
                percent: number;
            }[];
        } | {
            _type: "SplitByValue";
            where: Clause.t;
            splits: {
                _type: "Value";
                account: string;
                value: number;
            }[];
            remainder: string;
        } | {
            _type: "Attach";
            where: Clause.t;
            field: string;
            value: string;
        } | {
            _type: "Include";
            where: Clause.t;
        };
    }>;
    const Database: {
        TableType: iot.TypeC<{
            id: iot.StringC;
            account_id: iot.StringC;
            user_id: iot.StringC;
            rule: iot.UnionC<[iot.TypeC<{
                _type: iot.LiteralC<"Attach">;
                where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
                field: iot.StringC;
                value: iot.StringC;
            }>, iot.UnionC<[iot.TypeC<{
                _type: iot.LiteralC<"SplitByPercent">;
                where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
                splits: iot.ArrayC<iot.TypeC<{
                    _type: iot.LiteralC<"Percent">;
                    account: iot.StringC;
                    percent: iot.NumberC;
                }>>;
            }>, iot.TypeC<{
                _type: iot.LiteralC<"SplitByValue">;
                where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
                splits: iot.ArrayC<iot.TypeC<{
                    _type: iot.LiteralC<"Value">;
                    account: iot.StringC;
                    value: iot.NumberC;
                }>>;
                remainder: iot.StringC;
            }>]>, iot.TypeC<{
                _type: iot.LiteralC<"Include">;
                where: iot.RecursiveType<iot.Type<Clause.t, Clause.t, unknown>, Clause.t, Clause.t, unknown>;
            }>]>;
        }>;
        from: (obj: any) => E.Either<Exception.t, t>;
        to: (obj: t) => any;
    };
}
export declare namespace Frontend {
    namespace Create {
        const t: iot.TypeC<{
            accountId: iot.StringC;
            userId: iot.StringC;
            rule: iot.UnionC<[iot.TypeC<{
                _type: iot.LiteralC<"Attach">;
                where: iot.RecursiveType<iot.Type<Internal.Clause.t, Internal.Clause.t, unknown>, Internal.Clause.t, Internal.Clause.t, unknown>;
                field: iot.StringC;
                value: iot.StringC;
            }>, iot.UnionC<[iot.TypeC<{
                _type: iot.LiteralC<"SplitByPercent">;
                where: iot.RecursiveType<iot.Type<Internal.Clause.t, Internal.Clause.t, unknown>, Internal.Clause.t, Internal.Clause.t, unknown>;
                splits: iot.ArrayC<iot.TypeC<{
                    _type: iot.LiteralC<"Percent">;
                    account: iot.StringC;
                    percent: iot.NumberC;
                }>>;
            }>, iot.TypeC<{
                _type: iot.LiteralC<"SplitByValue">;
                where: iot.RecursiveType<iot.Type<Internal.Clause.t, Internal.Clause.t, unknown>, Internal.Clause.t, Internal.Clause.t, unknown>;
                splits: iot.ArrayC<iot.TypeC<{
                    _type: iot.LiteralC<"Value">;
                    account: iot.StringC;
                    value: iot.NumberC;
                }>>;
                remainder: iot.StringC;
            }>]>, iot.TypeC<{
                _type: iot.LiteralC<"Include">;
                where: iot.RecursiveType<iot.Type<Internal.Clause.t, Internal.Clause.t, unknown>, Internal.Clause.t, Internal.Clause.t, unknown>;
            }>]>;
        }>;
        export type t = iot.TypeOf<typeof t>;
        export const Json: Format.JsonFormatter<{
            accountId: string;
            userId: string;
            rule: {
                _type: "SplitByPercent";
                where: Internal.Clause.t;
                splits: {
                    _type: "Percent";
                    account: string;
                    percent: number;
                }[];
            } | {
                _type: "SplitByValue";
                where: Internal.Clause.t;
                splits: {
                    _type: "Value";
                    account: string;
                    value: number;
                }[];
                remainder: string;
            } | {
                _type: "Attach";
                where: Internal.Clause.t;
                field: string;
                value: string;
            } | {
                _type: "Include";
                where: Internal.Clause.t;
            };
        }>;
        export {};
    }
}
export declare namespace Channel {
    namespace Query {
        const t: iot.TypeC<{
            accountId: iot.StringC;
            userId: iot.StringC;
        }>;
        export type t = iot.TypeOf<typeof t>;
        export const Json: Format.JsonFormatter<{
            accountId: string;
            userId: string;
        }>;
        export {};
    }
    namespace Response {
        namespace RuleList {
            const t: iot.TypeC<{
                rules: iot.ArrayC<iot.TypeC<{
                    id: iot.StringC;
                    accountId: iot.StringC;
                    userId: iot.StringC;
                    rule: iot.UnionC<[iot.TypeC<{
                        _type: iot.LiteralC<"Attach">;
                        where: iot.RecursiveType<iot.Type<Internal.Clause.t, Internal.Clause.t, unknown>, Internal.Clause.t, Internal.Clause.t, unknown>;
                        field: iot.StringC;
                        value: iot.StringC;
                    }>, iot.UnionC<[iot.TypeC<{
                        _type: iot.LiteralC<"SplitByPercent">;
                        where: iot.RecursiveType<iot.Type<Internal.Clause.t, Internal.Clause.t, unknown>, Internal.Clause.t, Internal.Clause.t, unknown>;
                        splits: iot.ArrayC<iot.TypeC<{
                            _type: iot.LiteralC<"Percent">;
                            account: iot.StringC;
                            percent: iot.NumberC;
                        }>>;
                    }>, iot.TypeC<{
                        _type: iot.LiteralC<"SplitByValue">;
                        where: iot.RecursiveType<iot.Type<Internal.Clause.t, Internal.Clause.t, unknown>, Internal.Clause.t, Internal.Clause.t, unknown>;
                        splits: iot.ArrayC<iot.TypeC<{
                            _type: iot.LiteralC<"Value">;
                            account: iot.StringC;
                            value: iot.NumberC;
                        }>>;
                        remainder: iot.StringC;
                    }>]>, iot.TypeC<{
                        _type: iot.LiteralC<"Include">;
                        where: iot.RecursiveType<iot.Type<Internal.Clause.t, Internal.Clause.t, unknown>, Internal.Clause.t, Internal.Clause.t, unknown>;
                    }>]>;
                }>>;
            }>;
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                rules: {
                    id: string;
                    accountId: string;
                    userId: string;
                    rule: {
                        _type: "SplitByPercent";
                        where: Internal.Clause.t;
                        splits: {
                            _type: "Percent";
                            account: string;
                            percent: number;
                        }[];
                    } | {
                        _type: "SplitByValue";
                        where: Internal.Clause.t;
                        splits: {
                            _type: "Value";
                            account: string;
                            value: number;
                        }[];
                        remainder: string;
                    } | {
                        _type: "Attach";
                        where: Internal.Clause.t;
                        field: string;
                        value: string;
                    } | {
                        _type: "Include";
                        where: Internal.Clause.t;
                    };
                }[];
            }>;
            export {};
        }
    }
}

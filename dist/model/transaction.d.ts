import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";
import { Exception, Format } from "../magic";
export declare namespace Internal {
    const t: iot.TypeC<{
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
    type t = iot.TypeOf<typeof t>;
    const Json: Format.JsonFormatter<{
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
    }>;
    const Database: {
        TableType: iot.TypeC<{
            id: iot.StringC;
            source_id: iot.StringC;
            user_id: iot.StringC;
            amount: types.NumberFromStringC;
            merchant_name: iot.StringC;
            description: iot.StringC;
            authorized_at: types.DateC;
            captured_at: types.OptionFromNullableC<types.DateC>;
            metadata: iot.ObjectC;
        }>;
        from: (obj: any) => E.Either<Exception.t, t>;
        to: (obj: t) => any;
    };
    namespace Field {
        type NumberField = "amount" | "authorizedAt" | "capturedAt";
        const NumberField: iot.Type<Internal.Field.NumberField>;
        type OptionNumberField = "capturedAt";
        const OptionNumberField: iot.Type<Internal.Field.OptionNumberField>;
        type StringField = "id" | "sourceId" | "userId" | "merchantName" | "description";
        const StringField: iot.Type<Internal.Field.StringField>;
        type t = NumberField | StringField;
        const t: iot.Type<Internal.Field.t>;
    }
}
export declare namespace Frontend {
    namespace Create {
        const t: iot.TypeC<{
            id: iot.StringC;
            sourceId: iot.StringC;
            userId: iot.StringC;
            amount: iot.NumberC;
            merchantName: iot.StringC;
            description: iot.StringC;
            authorizedAt: types.DateC;
            capturedAt: types.OptionC<types.DateC>;
            metadata: iot.ObjectC;
        }>;
        export type t = iot.TypeOf<typeof t>;
        export const Json: Format.JsonFormatter<{
            id: string;
            sourceId: string;
            userId: string;
            amount: number;
            merchantName: string;
            description: string;
            authorizedAt: Date;
            capturedAt: O.Option<Date>;
            metadata: object;
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
    namespace Request {
        namespace Create {
            const t: iot.TypeC<{
                sourceId: iot.StringC;
                userId: iot.StringC;
                amount: iot.NumberC;
                merchantName: iot.StringC;
                description: iot.StringC;
                authorizedAt: iot.NumberC;
                capturedAt: types.OptionC<iot.NumberC>;
                metadata: iot.ObjectC;
            }>;
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                sourceId: string;
                userId: string;
                amount: number;
                merchantName: string;
                description: string;
                authorizedAt: number;
                capturedAt: O.Option<number>;
                metadata: object;
            }>;
            export {};
        }
    }
    namespace Response {
        namespace TransactionList {
            const t: iot.TypeC<{
                transactions: iot.ArrayC<iot.TypeC<{
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
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                transactions: {
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
            export {};
        }
    }
}

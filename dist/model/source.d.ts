import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";
import { Exception, Format } from "../magic";
export declare namespace Internal {
    const t: iot.TypeC<{
        id: iot.StringC;
        userId: iot.StringC;
        name: iot.StringC;
        integrationId: types.OptionC<iot.StringC>;
        tag: iot.StringC;
        createdAt: types.DateFromISOStringC;
    }>;
    type t = iot.TypeOf<typeof t>;
    const Json: Format.JsonFormatter<{
        id: string;
        userId: string;
        name: string;
        integrationId: O.Option<string>;
        tag: string;
        createdAt: Date;
    }>;
    const Database: {
        TableType: iot.TypeC<{
            id: iot.StringC;
            user_id: iot.StringC;
            name: iot.StringC;
            integration_id: types.OptionFromNullableC<iot.StringC>;
            tag: iot.StringC;
            created_at: types.DateC;
        }>;
        from: (obj: any) => E.Either<Exception.t, t>;
        to: (obj: t) => any;
    };
}
export declare namespace Frontend {
    namespace Create {
        const t: iot.TypeC<{
            userId: iot.StringC;
            name: iot.StringC;
            integrationId: types.OptionC<iot.StringC>;
            tag: iot.StringC;
        }>;
        export type t = iot.TypeOf<typeof t>;
        export const Json: Format.JsonFormatter<{
            userId: string;
            name: string;
            integrationId: O.Option<string>;
            tag: string;
        }>;
        export {};
    }
}
export declare namespace Channel {
    namespace Request {
        namespace Create {
            const t: iot.TypeC<{
                userId: iot.StringC;
                name: iot.StringC;
                integrationId: types.OptionC<iot.StringC>;
            }>;
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                userId: string;
                name: string;
                integrationId: O.Option<string>;
            }>;
            export {};
        }
    }
}
export declare namespace External {
    namespace Request {
        namespace Create {
            const t: iot.TypeC<{
                name: iot.StringC;
                integrationId: types.OptionC<iot.StringC>;
            }>;
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                name: string;
                integrationId: O.Option<string>;
            }>;
            export {};
        }
    }
    namespace Response {
        namespace SourceList {
            const t: iot.TypeC<{
                sources: iot.ArrayC<iot.TypeC<{
                    id: iot.StringC;
                    userId: iot.StringC;
                    name: iot.StringC;
                    integrationId: types.OptionC<iot.StringC>;
                    tag: iot.StringC;
                    createdAt: types.DateFromISOStringC;
                }>>;
            }>;
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                sources: {
                    id: string;
                    userId: string;
                    name: string;
                    integrationId: O.Option<string>;
                    tag: string;
                    createdAt: Date;
                }[];
            }>;
            export {};
        }
    }
}

import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import { Exception, Format } from "../magic";
export declare const DEFAULT_ROLE = "user";
export declare const SUPERUSER_ROLE = "superuser";
export declare namespace Internal {
    const t: iot.TypeC<{
        id: iot.StringC;
        email: iot.StringC;
        password: iot.StringC;
        role: iot.StringC;
    }>;
    type t = iot.TypeOf<typeof t>;
    const Json: Format.JsonFormatter<{
        id: string;
        email: string;
        password: string;
        role: string;
    }>;
    const Database: {
        TableType: iot.TypeC<{
            id: iot.StringC;
            email: iot.StringC;
            password: iot.StringC;
            role: iot.StringC;
        }>;
        from: (obj: any) => E.Either<Exception.t, t>;
        to: (obj: t) => any;
    };
}
export declare namespace Frontend {
    namespace Create {
        const t: iot.TypeC<{
            email: iot.StringC;
            password: iot.StringC;
            role: iot.StringC;
        }>;
        export type t = iot.TypeOf<typeof t>;
        export const Json: Format.JsonFormatter<{
            email: string;
            password: string;
            role: string;
        }>;
        export {};
    }
}
export declare namespace External {
    namespace Request {
        namespace Credentials {
            const t: iot.TypeC<{
                email: iot.StringC;
                password: iot.StringC;
            }>;
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                email: string;
                password: string;
            }>;
            export {};
        }
        namespace Create {
            const t: iot.TypeC<{
                email: iot.StringC;
                password: iot.StringC;
            }>;
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                email: string;
                password: string;
            }>;
            export {};
        }
    }
    namespace Response {
        namespace Token {
            const t: iot.TypeC<{
                token: iot.StringC;
            }>;
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                token: string;
            }>;
            export {};
        }
        namespace UserList {
            const t: iot.TypeC<{
                users: iot.ArrayC<iot.TypeC<{
                    id: iot.StringC;
                    email: iot.StringC;
                    password: iot.StringC;
                    role: iot.StringC;
                }>>;
            }>;
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                users: {
                    id: string;
                    email: string;
                    password: string;
                    role: string;
                }[];
            }>;
            export {};
        }
    }
}

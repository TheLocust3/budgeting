import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import { Exception, Format } from "../magic";
export declare namespace Internal {
    export const Credentials: iot.TypeC<{
        _type: iot.LiteralC<"Plaid">;
        itemId: iot.StringC;
        accessToken: iot.StringC;
    }>;
    export type Credentials = iot.TypeOf<typeof Credentials>;
    const t: iot.TypeC<{
        id: iot.StringC;
        userId: iot.StringC;
        name: iot.StringC;
        credentials: iot.TypeC<{
            _type: iot.LiteralC<"Plaid">;
            itemId: iot.StringC;
            accessToken: iot.StringC;
        }>;
    }>;
    export type t = iot.TypeOf<typeof t>;
    export const Json: Format.JsonFormatter<{
        id: string;
        userId: string;
        name: string;
        credentials: {
            _type: "Plaid";
            itemId: string;
            accessToken: string;
        };
    }>;
    export const Database: {
        TableType: iot.TypeC<{
            id: iot.StringC;
            user_id: iot.StringC;
            name: iot.StringC;
            credentials: iot.TypeC<{
                _type: iot.LiteralC<"Plaid">;
                itemId: iot.StringC;
                accessToken: iot.StringC;
            }>;
        }>;
        from: (obj: any) => E.Either<Exception.t, t>;
        to: (obj: t) => any;
    };
    export {};
}
export declare namespace Frontend {
    namespace Create {
        const t: iot.TypeC<{
            userId: iot.StringC;
            name: iot.StringC;
            credentials: iot.TypeC<{
                _type: iot.LiteralC<"Plaid">;
                itemId: iot.StringC;
                accessToken: iot.StringC;
            }>;
        }>;
        export type t = iot.TypeOf<typeof t>;
        export const Json: Format.JsonFormatter<{
            userId: string;
            name: string;
            credentials: {
                _type: "Plaid";
                itemId: string;
                accessToken: string;
            };
        }>;
        export {};
    }
}

import * as iot from "io-ts";
import { Format } from "../magic";
export declare namespace External {
    namespace Request {
        namespace ExchangePublicToken {
            const Account: iot.TypeC<{
                id: iot.StringC;
                name: iot.StringC;
            }>;
            export type Account = iot.TypeOf<typeof Account>;
            const t: iot.TypeC<{
                publicToken: iot.StringC;
                accounts: iot.ArrayC<iot.TypeC<{
                    id: iot.StringC;
                    name: iot.StringC;
                }>>;
                institutionName: iot.StringC;
            }>;
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                publicToken: string;
                accounts: {
                    id: string;
                    name: string;
                }[];
                institutionName: string;
            }>;
            export {};
        }
    }
    namespace Response {
        namespace CreateLinkToken {
            const t: iot.TypeC<{
                token: iot.StringC;
            }>;
            export type t = iot.TypeOf<typeof t>;
            export const Json: Format.JsonFormatter<{
                token: string;
            }>;
            export {};
        }
    }
}

import * as iot from "io-ts";
import { Format } from "../magic";
export declare namespace Response {
    namespace Status {
        const t: iot.TypeC<{
            status: iot.StringC;
        }>;
        export type t = iot.TypeOf<typeof t>;
        export const Json: Format.JsonFormatter<{
            status: string;
        }>;
        export {};
    }
}

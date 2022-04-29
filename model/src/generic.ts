import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import * as Rule from "./rule";

import { Exception, Format } from "magic";

export namespace Response {
  export namespace Status {
    const t = iot.type({
      status: iot.string
    });

    export type t = iot.TypeOf<typeof t>
    export const Json = new Format.JsonFormatter(t);
  }
}

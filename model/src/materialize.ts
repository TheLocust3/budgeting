import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import * as Rule from "./rule";
import * as Transaction from "./transaction";

import { Exception, Format } from "magic";

export namespace Internal {
  export const Conflict = iot.type({
      element: Transaction.Internal.t
    , rules: iot.array(Rule.Internal.Rule)
  });
  export type Conflict = iot.TypeOf<typeof Conflict>;

  export const t = iot.type({
      conflicts: iot.array(Conflict)
    , tagged: iot.record(iot.string, iot.array(Transaction.Internal.t))
    , untagged: iot.array(Transaction.Internal.t)
  });
  export type t = iot.TypeOf<typeof t>;

  export const Json = new Format.JsonFormatter(t);
}
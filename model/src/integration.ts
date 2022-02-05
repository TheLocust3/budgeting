import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception, Format } from "magic";

export namespace Internal {
  namespace Plaid {
    const Credentials = iot.type({
        itemId: iot.string
      , accessToken: iot.string
    });

    const Source = iot.type({
        name: iot.string
      , forAccountId: iot.string
      , createdAt: types.option(types.DateFromISOString)
    })

    export const t = iot.type({
        _type: iot.literal("Plaid")
      , name: iot.string
      , credentials: Credentials
      , sources: iot.array(Source)
    })
  }

  namespace None {
    export const t = iot.type({
        _type: iot.literal("None")
      , name: iot.string
    })
  }

  export const t = iot.union([Plaid.t, None.t])
  export type t = iot.TypeOf<typeof t>

  export const Json = new Format.JsonFormatter(t);
}

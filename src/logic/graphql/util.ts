import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Exception } from "../../magic";

// GraphQL inserts a null as the first element of an input.
// This is a ridiculous conversion.
export const asList = <T>(list: T[]): T[] => JSON.parse(JSON.stringify(list))

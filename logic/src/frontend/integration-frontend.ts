import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Integration } from "model";
import { IntegrationEntry } from "storage";
import { Exception } from "magic";

export namespace IntegrationFrontend {
  export const all = (userEmail: string): TE.TaskEither<Exception.t, Integration.Internal.t[]> => {
    return IntegrationEntry.all(userEmail);
  };

  export const create = (userEmail: string) => (integration: Integration.Internal.t): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    return pipe(
        IntegrationEntry.create(userEmail)(integration)
      , TE.map(() => integration)
    );
  };

  export const deleteById = (userEmail: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return IntegrationEntry.deleteById(userEmail)(id);
  };
}

export default IntegrationFrontend;

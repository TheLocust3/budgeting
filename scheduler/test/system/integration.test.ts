import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { System, uuid } from "./util";

const testCredentials = { _type: "Plaid", itemId: "test", accessToken: "test" }

let system: System;
beforeAll(async () => {
  system = new System();
});

it("can add integration", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addIntegration(name, "test", testCredentials)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integration: any) => {
            expect(integration).toEqual(expect.objectContaining({ userId: "test", name: name, credentials: testCredentials }));
            expect(typeof integration.id).toBe("string");
          }
      )
  )();
});

it("can get integration", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addIntegration(name, "test", testCredentials)
    , TE.chain((integration) => system.getIntegration(integration.id, "test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integration) => {
            expect(integration).toEqual(expect.objectContaining({ userId: "test", name: name, credentials: testCredentials }));
            expect(typeof integration.id).toBe("string");
          }
      )
  )();
});

it("can list integrations", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addIntegration(name, "test", testCredentials)
    , TE.chain((_) => system.listIntegrations("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integrations) => {
            const integration = integrations.integrations.filter((integration: any) => integration.name === name)[0];

            expect(integration).toEqual(expect.objectContaining({ userId: "test", name: name, credentials: testCredentials }));
            expect(typeof integration.id).toBe("string");

            integrations.integrations.map((integration: any) => expect(integration.userId).toBe("test"));
          }
      )
  )();
});

it("can delete integration", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addIntegration(name, "test", testCredentials)
    , TE.chain((integration) => system.deleteIntegration(integration.id, "test"))
    , TE.chain((_) => system.listIntegrations("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integrations) => {
            const integration = integrations.integrations.filter((integration: any) => integration.name === name);

            expect(integration.length).toEqual(0);
          }
      )
  )();
});

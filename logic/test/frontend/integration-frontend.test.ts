import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import IntegrationFrontend from "../../src/frontend/integration-frontend";
import { uuid } from "../system/util";

import { Integration } from "../../../model/src/index";

const testCredentials: Integration.Internal.Credentials = { _type: "Plaid", itemId: "test", accessToken: "test" }

it("can add integration", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      IntegrationFrontend.create({ id: "", userId: "test", name: name, credentials: testCredentials })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integration) => {
            expect(integration).toEqual(expect.objectContaining({ userId: "test", name: name, credentials: testCredentials }));
            expect(integration.id).not.toBe("");
          }
      )
  )();
});

it("can get integration", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      IntegrationFrontend.create({ id: "", userId: "test", name: name, credentials: testCredentials })
    , TE.chain((integration) => IntegrationFrontend.getById(integration.userId)(integration.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integration) => {
            expect(integration).toEqual(expect.objectContaining({ userId: "test", name: name, credentials: testCredentials }));
            expect(integration.id).not.toBe("");
          }
      )
  )();
});

it("can't get other user's integration", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      IntegrationFrontend.create({ id: "", userId: "test", name: name, credentials: testCredentials })
    , TE.chain((integration) => IntegrationFrontend.getById("test2")(integration.id))
    , TE.match(
          (res) => { expect(res._type).toBe("NotFound"); }
        , (_) => { throw new Error("Got unexpected successful response"); }
      )
  )();
});

it("can list integrations", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      IntegrationFrontend.create({ id: "", userId: "test", name: name, credentials: testCredentials })
    , TE.chain((_) => IntegrationFrontend.all("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integrations) => {
            const integration = integrations.filter((integration) => integration.name === name)[0];

            expect(integration).toEqual(expect.objectContaining({ userId: "test", name: name, credentials: testCredentials }));
            expect(integration.id).not.toBe("");

            integrations.map((integration) => expect(integration.userId).toBe("test"));
          }
      )
  )();
});

it("can delete integration", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      IntegrationFrontend.create({ id: "", userId: "test", name: name, credentials: testCredentials })
    , TE.chain((integration) => IntegrationFrontend.deleteById("test")(integration.id))
    , TE.chain((_) => IntegrationFrontend.all("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integrations) => {
            const integration = integrations.filter((integration) => integration.name === name);

            expect(integration.length).toEqual(0);
          }
      )
  )();
});

it("can't delete other user's integration", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      IntegrationFrontend.create({ id: "", userId: "test2", name: name, credentials: testCredentials })
    , TE.chain((integration) => IntegrationFrontend.deleteById("test")(integration.id))
    , TE.chain((_) => IntegrationFrontend.all("test2"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integrations) => {
            const integration = integrations.filter((integration) => integration.name === name)[0];

            expect(integration).toEqual(expect.objectContaining({ name: name }));
            expect(integration.id).not.toBe("");
          }
      )
  )();
});

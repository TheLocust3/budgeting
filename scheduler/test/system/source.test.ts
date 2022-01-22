import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { System, uuid } from "./util";

let system: System;
beforeAll(async () => {
  system = new System();
});

it("can add source", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addSource(name, "test")
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (source: any) => {
            expect(source).toEqual(expect.objectContaining({ userId: "test", name: name }));
            expect(typeof source.id).toBe("string");
          }
      )
  )();
});

it("can get source", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addSource(name, "test")
    , TE.chain((source) => system.getSource(source.id, "test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (source) => {
            expect(source).toEqual(expect.objectContaining({ userId: "test", name: name }));
            expect(typeof source.id).toBe("string");
          }
      )
  )();
});

it("can list sources", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addSource(name, "test")
    , TE.chain((_) => system.listSources("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (sources) => {
            const source = sources.sources.filter((source: any) => source.name === name)[0];

            expect(source).toEqual(expect.objectContaining({ userId: "test", name: name }));
            expect(typeof source.id).toBe("string");

            sources.sources.map((source: any) => expect(source.userId).toBe("test"));
          }
      )
  )();
});

it("can delete source", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addSource(name, "test")
    , TE.chain((source) => system.deleteSource(source.id, "test"))
    , TE.chain((_) => system.listSources("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (sources) => {
            const source = sources.sources.filter((source: any) => source.name === name);

            expect(source.length).toEqual(0);
          }
      )
  )();
});

import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import SourceFrontend from "../../src/frontend/source-frontend";
import { uuid } from "../system/util";

it("can add source", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      SourceFrontend.create({ id: O.none, userId: "test", name: name })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (source) => {
            expect(source).toEqual(expect.objectContaining({ userId: "test", name: name }));
            expect(O.isSome(source.id)).toBe(true);
          }
      )
  )();
});

it("can get source", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      SourceFrontend.create({ id: O.none, userId: "test", name: name })
    , TE.chain((source) => SourceFrontend.getById(source.userId)(O.match(() => "", (source: string) => source)(source.id)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (source) => {
            expect(source).toEqual(expect.objectContaining({ userId: "test", name: name }));
            expect(O.isSome(source.id)).toBe(true);
          }
      )
  )();
});

it("can't get other user's source", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      SourceFrontend.create({ id: O.none, userId: "test", name: name })
    , TE.chain((source) => SourceFrontend.getById("test2")(O.match(() => "", (source: string) => source)(source.id)))
    , TE.match(
          (res) => { expect(res._type).toBe("NotFound"); }
        , (_) => { throw new Error("Got unexpected successful response"); }
      )
  )();
});

it("can list sources", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      SourceFrontend.create({ id: O.none, userId: "test", name: name })
    , TE.chain((_) => SourceFrontend.all("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (sources) => {
            const source = sources.filter((source) => source.name === name)[0];

            expect(source).toEqual(expect.objectContaining({ userId: "test", name: name }));
            expect(O.isSome(source.id)).toBe(true);

            sources.map((source) => expect(source.userId).toBe("test"));
          }
      )
  )();
});

it("can delete source", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      SourceFrontend.create({ id: O.none, userId: "test", name: name })
    , TE.chain((source) => SourceFrontend.deleteById("test")(O.match(() => "", (source: string) => source)(source.id)))
    , TE.chain((_) => SourceFrontend.all("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (sources) => {
            const source = sources.filter((source) => source.name === name);

            expect(source.length).toEqual(0);
          }
      )
  )();
});

it("can't delete other user's source", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      SourceFrontend.create({ id: O.none, userId: "test2", name: name })
    , TE.chain((source) => SourceFrontend.deleteById("test")(O.match(() => "", (source: string) => source)(source.id)))
    , TE.chain((_) => SourceFrontend.all("test2"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (sources) => {
            const source = sources.filter((source) => source.name === name)[0];

            expect(source).toEqual(expect.objectContaining({ name: name }));
            expect(O.isSome(source.id)).toBe(true);
          }
      )
  )();
});

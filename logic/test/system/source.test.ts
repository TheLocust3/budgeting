import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import { System, uuid } from './util';

let system: System;
let otherSystem: System;
let userId: string;
beforeAll(async () => {
  system = new System();
  otherSystem = new System();
  
  const email = `test-${uuid()}`;
  const otherEmail = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('user', () => system.addUser(email, "foobar"))
    , TE.bind('token', () => system.login(email, "foobar"))
    , TE.bind('otherUser', () => otherSystem.addUser(otherEmail, "foobar"))
    , TE.bind('otherToken', () => otherSystem.login(otherEmail, "foobar"))
    , TE.match(
          (error) => { throw error; }
        , ({ user }) => { userId = user.id; }
      )
  )();
});

it('can add source', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addSource(name)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (source: any) => {
            expect(source).toEqual(expect.objectContaining({ userId: userId, name: name }));
            expect(typeof source.id).toBe("string");
          }
      )
  )();
});

it('can get source', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addSource(name)
    , TE.chain((source) => system.getSource(source.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (_source) => {
            const source = _source.source
            expect(source).toEqual(expect.objectContaining({ userId: userId, name: name }));
            expect(typeof source.id).toBe('string');
          }
      )
  )();
});

it('can\'t get other user\'s source', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      otherSystem.addSource(name)
    , TE.chain((source) => system.getSource(source.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (res) => {
            expect(res.message).toBe("failed")
          }
      )
  )();
});

it('can list sources', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addSource(name)
    , TE.chain((_) => system.listSources())
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (sources) => {
            const source = sources.sources.filter((source: any) => source.name === name)[0]

            expect(source).toEqual(expect.objectContaining({ userId: userId, name: name }));
            expect(typeof source.id).toBe('string');

            sources.sources.map((source: any) => expect(source.userId).toBe(userId))
          }
      )
  )();
});

it('can delete source', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addSource(name)
    , TE.chain((source) => system.deleteSource(source.id))
    , TE.chain((_) => system.listSources())
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (sources) => {
            const source = sources.sources.filter((source: any) => source.name === name)

            expect(source.length).toEqual(0);
          }
      )
  )();
});

it('can\'t delete other user\'s source', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      otherSystem.addSource(name)
    , TE.chain((source) => system.deleteSource(source.id))
    , TE.chain((_) => otherSystem.listSources())
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (sources) => {
            const source = sources.sources.filter((source: any) => source.name === name)[0]

            expect(source).toEqual(expect.objectContaining({ name: name }));
            expect(typeof source.id).toBe('string');
          }
      )
  )();
});

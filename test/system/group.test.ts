import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import { System, uuid } from './util';

let system: System;
beforeAll(() => {
  system = new System();
})

it('can add group', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addGroup(name)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (group: any) => {
            expect(group).toEqual(expect.objectContaining({ name: name }));
            expect(typeof group.id).toBe('string');
          }
      )
  )();
});

it('can get group', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addGroup(name)
    , TE.chain((group) => system.getGroup(group.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (_group) => {
            const group = _group.group
            expect(group).toEqual(expect.objectContaining({ name: name }));
            expect(typeof group.id).toBe('string');
          }
      )
  )();
});

it('can list groups', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addGroup(name)
    , TE.chain((_) => system.listGroups())
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (groups) => {
            const group = groups.groups.filter((group: any) => group.name === name)[0]

            expect(group).toEqual(expect.objectContaining({ name: name }));
            expect(typeof group.id).toBe('string');
          }
      )
  )();
});

it('can delete group', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addGroup(name)
    , TE.chain((group) => system.deleteGroup(group.id))
    , TE.chain((_) => system.listGroups())
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (groups) => {
            const group = groups.groups.filter((group: any) => group.name === name)

            expect(group.length).toEqual(0);
          }
      )
  )();
});

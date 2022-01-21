import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import { System, uuid } from './util';

let system: System;
beforeAll(async () => {
  system = new System();
});

it('can add user', async () => {
  const email = `test-${uuid()}`;
  await pipe(
      system.addUser(email, "foobar")
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (user: any) => {
            expect(user).toEqual(expect.objectContaining({ email: email }));
            expect(typeof user.id).toBe("string");
            expect(user.password).not.toBe("foobar");
          }
      )
  )();
});

it('can get user', async () => {
  const email = `test-${uuid()}`;
  await pipe(
      system.addUser(email, "foobar")
    , TE.chain((user) => system.getUser(user.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (_user) => {
            const user = _user.user
            expect(user).toEqual(expect.objectContaining({ email: email }));
            expect(typeof user.id).toBe('string');
            expect(user.password).not.toBe("foobar");
          }
      )
  )();
});

it('can list users', async () => {
  const email = `test-${uuid()}`;
  await pipe(
      system.addUser(email, "foobar")
    , TE.chain((_) => system.listUsers())
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (users) => {
            const user = users.users.filter((user: any) => user.email === email)[0]

            expect(user).toEqual(expect.objectContaining({ email: email }));
            expect(typeof user.id).toBe('string');
            expect(user.password).not.toBe("foobar");
          }
      )
  )();
});

it('can delete user', async () => {
  const email = `test-${uuid()}`;
  await pipe(
      system.addUser(email, "foobar")
    , TE.chain((user) => system.deleteUser(user.id))
    , TE.chain((_) => system.listUsers())
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (users) => {
            const user = users.users.filter((user: any) => user.email === email)

            expect(user.length).toEqual(0);
          }
      )
  )();
});

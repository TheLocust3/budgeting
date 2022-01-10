import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import { System } from './util';

let system: System;
beforeAll(() => {
  system = new System();
})

it('can add group', async () => {
  await pipe(
      system.addGroup('test')
    , TE.match(
          (error) => fail(`Failed with ${error}`)
        , (group: any) => {
            expect(group).toEqual(expect.objectContaining({ name: 'test' }));
            expect(group.id).toBeDefined();
            expect(typeof group.id).toBe('string');
          }
      )
  )()
});

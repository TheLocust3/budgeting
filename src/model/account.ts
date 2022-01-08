import * as t from 'io-ts';

export const Account = t.type({
  id: t.string,
  groupId: t.string,
  name: t.string
})

export type Account = t.TypeOf<typeof Account>

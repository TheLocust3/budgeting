import * as t from 'io-ts';

export const Select = t.type({
  _type: t.literal("Select")
})
export type Select = t.TypeOf<typeof Select>

export const Attach = t.type({
  _type: t.literal("Attach")
})
export type Attach = t.TypeOf<typeof Attach>


export const Rule = t.type({
  id: t.string,
  groupId: t.string,
  rule: t.union([Select, Attach])
})
export type Rule = t.TypeOf<typeof Rule>

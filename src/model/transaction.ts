import * as t from 'io-ts';
import { DateFromUnixTime, optionFromNullable } from 'io-ts-types';

export const Transaction = t.type({
  id: t.string,
  sourceId: t.string,
  amount: t.number,
  merchantName: t.string,
  description: t.string,
  authorizedAt: t.number,
  capturedAt: optionFromNullable(DateFromUnixTime)
})

export type Transaction = t.TypeOf<typeof Transaction>

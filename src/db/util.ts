import { QueryResult } from 'pg';
import * as TE from 'fp-ts/TaskEither';

export const expectOne = TE.chain((res: QueryResult) => {
  if (res.rows.length === 1) {
    return TE.left(new Error(`Expected single row, received ${res.rows}`));
  } else {
    return TE.right(res);
  }
})
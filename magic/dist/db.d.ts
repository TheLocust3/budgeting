import { QueryResult } from 'pg';
import * as TE from 'fp-ts/TaskEither';
export declare const expectOne: (ma: TE.TaskEither<Error, QueryResult<any>>) => TE.TaskEither<Error, QueryResult<any>>;

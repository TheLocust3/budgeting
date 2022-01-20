import * as E from 'fp-ts/Either';
import * as Exception from './exception';
export declare const fromQuery: (value: string | string[] | undefined) => E.Either<Exception.t, string>;

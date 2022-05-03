import Express from "express";
import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import { User } from "../model";
import { Exception } from "../magic";
export declare namespace AuthenticationFor {
    const user: (request: Express.Request, response: Express.Response, next: Express.NextFunction) => Promise<void>;
    const admin: (request: Express.Request, response: Express.Response, next: Express.NextFunction) => Promise<void>;
}
export declare namespace JWT {
    const sign: (user: User.Internal.t) => string;
    const verify: (pool: Pool) => (token: string) => TE.TaskEither<Exception.t, User.Internal.t>;
}

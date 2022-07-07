import { Pool } from "pg";

export type t = {
  id: string;
  pool: Pool;
}

export const empty = (request: any, response: any) => {
  return {
      id: response.locals.id
    , pool: request.app.locals.db
  }
}
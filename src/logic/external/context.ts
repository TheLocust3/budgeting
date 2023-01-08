import { Pool } from "pg";
import { getAuth, Auth } from "firebase/auth";

export type t = {
  id: string;
  pool: Pool;
  auth: Auth
}

export const empty = (request: any, response: any) => {
  return {
      id: response.locals.id
    , pool: request.app.locals.db
    , auth: getAuth()
  }
}
import { Pool } from "pg";

import * as UsersTable from "./users-table";
import UserFrontend from "../frontend/user-frontend";

const migrate = async (pool: Pool) => {
  await UsersTable.migrate(pool)();
  await UserFrontend.create(pool)({ id: "", email: "jake.kinsella@gmail.com", password: "foobar", role: "superuser" })();
  console.log("Migrate complete");
  process.exit(0);
};

console.log("Migrate start");

export const pool = new Pool();
migrate(pool);

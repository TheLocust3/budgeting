import * as Transactions from './transactions'
import * as Accounts from './accounts'
import * as Rules from './rules'

const migrate = async () => {
  await Transactions.migrate();
  await Accounts.migrate();
  await Rules.migrate();
  console.log("Migrate complete");
  process.exit(0);
}

console.log("Migrate start");
migrate();

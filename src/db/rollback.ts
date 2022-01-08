import * as Transactions from './transactions'
import * as Accounts from './accounts'
import * as Rules from './rules'

const rollback = async () => {
  await Rules.rollback();
  await Accounts.rollback();
  await Transactions.rollback();
  console.log("Rollback complete");
  process.exit(0);
}

console.log("Rollback start");
rollback();

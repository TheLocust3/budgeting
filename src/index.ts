import Koa from 'koa';
import { Transaction } from './model/transaction';

const app = new Koa();

app.use(async (ctx: Koa.Context) => {
  ctx.body = 'Hello World';
});

app.listen(3000);
console.log("Listening at localhost:3000");

import { graphqlHTTP } from 'express-graphql';

import Schema from './schema';
import * as Context from './context';

const endpoint = graphqlHTTP((request, response) => ({
    schema: Schema
  , graphiql: true
  , context: Context.empty(request, response)
}))

export default endpoint;
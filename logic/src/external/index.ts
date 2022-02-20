import { graphqlHTTP } from 'express-graphql';

import Schema from './schema';

const endpoint = graphqlHTTP((request, response) => ({
    schema: Schema
  , graphiql: true
}))

export default endpoint;
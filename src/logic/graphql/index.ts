import { graphqlHTTP } from 'express-graphql';

import Schema from './schema';
import * as Context from './context';

import { Exception } from "../../magic";

const endpoint = graphqlHTTP((request, response) => ({
    schema: Schema
  , graphiql: true
  , context: Context.empty(request, response)
  , customFormatErrorFn: (error) => {
      if (error.originalError === undefined) {
        return error.toJSON();
      }

      const thrownValue = (<any>error.originalError).thrownValue
      if (thrownValue === undefined) {
        return error.toJSON();
      } else {
        return { ...error.toJSON(), message: Exception.format(thrownValue) };
      }
    }
}))

export default endpoint;
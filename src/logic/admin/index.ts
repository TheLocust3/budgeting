import { graphqlHTTP } from 'express-graphql';

import Schema from './schema';
import * as Context from './context';

import { Exception } from "../../magic";

const endpoint = graphqlHTTP((request, response) => ({
    schema: Schema
  , graphiql: true
  , context: Context.empty(request, response)
  , customFormatErrorFn: (error) => {
      request.log.error(error)
      if (error.originalError === undefined) {
        return error.toJSON();
      }

      const thrownValue = (<any>error.originalError).thrownValue
      if (thrownValue === undefined) {
        return { ...error.toJSON(), ...Exception.format(error) };
      } else {
        response.statusCode = 200;
        return { ...error.toJSON(), ...Exception.format(thrownValue) };
      }
    }
}))

export default endpoint;
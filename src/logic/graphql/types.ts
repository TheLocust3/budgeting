import * as graphql from "graphql";
import { GraphQLJSONObject } from 'graphql-type-json';

export namespace User {
  export const t = new graphql.GraphQLObjectType({
      name: 'User'
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , email: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  })
}

export namespace Integration {
  export type t = {
    id: string;
    name: string;
    sources: { id: string; name: string }[];
  }

  const Source = new graphql.GraphQLObjectType({
      name: 'Source'
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  })

  export const t = new graphql.GraphQLObjectType({
      name: 'Integration'
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , sources: { type: new graphql.GraphQLNonNull(new graphql.GraphQLList(Source)) }
      }
  })
}

export namespace Notification {
  export type t = {
    id: string;
    createdAt: number;
    title: string;
    body: string;
    acked: boolean;
  }

  export const t = new graphql.GraphQLObjectType({
      name: 'Notification'
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , createdAt: { type: new graphql.GraphQLNonNull(graphql.GraphQLFloat) }
        , title: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , body: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , acked: { type: new graphql.GraphQLNonNull(graphql.GraphQLBoolean) }
      }
  })
}

export namespace Rule {
  export const t = new graphql.GraphQLObjectType({
      name: 'Rule'
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , rule: { type: new graphql.GraphQLNonNull(GraphQLJSONObject) }
      }
  });
}

export namespace RuleBody {
  export const t = new graphql.GraphQLNonNull(GraphQLJSONObject)
}

export namespace Transaction {
  export type t = {
    id: string;
    sourceId: string;
    amount: number;
    merchantName: string;
    description: string;
    authorizedAt: number;
    capturedAt?: number;
    metadata: object;
  }

  export const t = new graphql.GraphQLObjectType({
      name: 'Transaction'
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , sourceId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , amount: { type: new graphql.GraphQLNonNull(graphql.GraphQLFloat) }
        , merchantName: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , description: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , authorizedAt: { type: new graphql.GraphQLNonNull(graphql.GraphQLFloat) }
        , capturedAt: { type: graphql.GraphQLFloat }
        , metadata: { type: new graphql.GraphQLNonNull(GraphQLJSONObject) }
      }
  });

  export namespace Input {
    export type t = {
      sourceId: string;
      amount: number;
      merchantName: string;
      description: string;
      authorizedAt: number;
      capturedAt?: number;
      metadata: object;
    };
    export const t = {
        sourceId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      , amount: { type: new graphql.GraphQLNonNull(graphql.GraphQLFloat) }
      , merchantName: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      , description: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      , authorizedAt: { type: new graphql.GraphQLNonNull(graphql.GraphQLFloat) }
      , capturedAt: { type: graphql.GraphQLFloat }
      , metadata: { type: GraphQLJSONObject }
    };
  }
}

export namespace Account {
  export const t = new graphql.GraphQLObjectType({
      name: 'Transaction'
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  });
}

export namespace Void {
  export const t = graphql.GraphQLBoolean
}

export namespace PlaidAccount {
  export type t = { id: string; name: string; };
  export const t = new graphql.GraphQLInputObjectType({
      name: "PlaidAccount"
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  });
}

export namespace Template {
  export const t = new graphql.GraphQLObjectType({
      name: "Template"
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , accountId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , userId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , template: { type: new graphql.GraphQLNonNull(GraphQLJSONObject) }
      }
  });
}

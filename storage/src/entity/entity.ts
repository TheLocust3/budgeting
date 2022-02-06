import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { ThunkObjMap, GraphQLOutputType, GraphQLFieldConfig, GraphQLObjectType } from 'graphql';

import { Passthrough } from "./passthrough";

import { Exception, Format } from "magic";

type FieldConfig = {
  type: GraphQLOutputType;
}

type Config = {
  root: string;
  name: string;
  fields: ThunkObjMap<FieldConfig>;
}

class StorageObject<T> {
  private storageRoot: string;
  private objectName: string;
  private objectType: GraphQLObjectType;

  constructor(config: Config) {
    this.storageRoot = config.root;
    this.objectName = config.name;

    // TODO: JK
    this.objectType = new GraphQLObjectType({ name: config.name, fields: () => ({}) });
  }

  async query(source: string): Promise<T> {
    throw new Error("Unimplemented");
  }

  async mutate(source: string, write: (obj: any) => any): Promise<T> {
    throw new Error("Unimplemented");
  }
}

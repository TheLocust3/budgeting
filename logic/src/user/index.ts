import * as Resource from "./resource";

export * as UserArena from "./arena";

export namespace UserResource {
  export const create = Resource.createUser;

  export namespace Bucket {
    export const create = Resource.createBucket;
  }

  export namespace Rule {
    export const splitTransaction = Resource.splitTransaction;
    export const remove = Resource.removeRule;
  }

  export namespace Integration {
    export const create = Resource.createIntegration;
  }
}
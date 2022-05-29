import * as Resource from "./resource";

export * as UserArena from "./arena";

export namespace UserResource {
  export const create = Resource.createUser;

  export namespace Account {
    export const create = Resource.createManualAccount;
    export const remove = Resource.removeAccount;
  }

  export namespace Source {
    export const remove = Resource.removeSource
  }

  export namespace Bucket {
    export const create = Resource.createBucket;
  }

  export namespace Rule {
    export const splitTransaction = Resource.splitTransaction;
    export const remove = Resource.removeRule;
  }

  export namespace Integration {
    export const create = Resource.createIntegration;
    export const remove = Resource.removeIntegration;
  }

  export namespace Transaction {
    export const create = Resource.createTransaction;
    export const remove = Resource.removeTransaction
  }
}
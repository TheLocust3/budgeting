import * as T from "fp-ts/Task";
declare type Job = (id: string) => T.Task<boolean>;
export declare const enqueue: (job: Job, retriesRemaining?: number) => void;
export {};

import crypto from "crypto";
import EventEmitter from 'events';
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/pipeable";
import { withTimeout } from 'fp-ts-contrib/Task/withTimeout'

type Job = (id: string) => T.Task<boolean>
type Element = {
  job: Job;
  retriesRemaining: number;
}

class ReaperEmitter extends EventEmitter {}

const emitter = new ReaperEmitter();
let queue: Element[] = []

export const enqueue = (job: Job, retriesRemaining: number = 5) => {
  queue.push({ job: job, retriesRemaining: retriesRemaining });
  emitter.emit("enqueue");
}

/*
Example:

  Reaper.enqueue((id) => {
    return async () => {
      console.log(`TESTEST ${id}`);
      return true;
    };
  });
*/

emitter.on("enqueue", async () => {
  const id = crypto.randomUUID();
  const element = queue.shift();

  if (element !== undefined) {
    const { job, retriesRemaining } = element;

    console.log(`Reaper - starting job ${id}`);
    await pipe(
        withTimeout(false, 5000)(job(id))
      , T.map((succeeded) => {
          if (succeeded) {
            console.log(`Reaper - job ${id} succeeded`);
          } else {
            if (retriesRemaining > 0) {
              console.log(`Reaper - job ${id} failed, retrying - ${retriesRemaining}`);
              setTimeout(() => enqueue(job, retriesRemaining - 1), 500);
            } else {
              console.log(`Reaper - job ${id} failed, exceeded max retries`);
            }
          }
        })
    )();
  }
});


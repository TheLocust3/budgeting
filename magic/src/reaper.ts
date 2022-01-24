import crypto from "crypto";
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

let queue: Element[] = []

/*
Example:

  Reaper.enqueue((id) => {
    return async () => {
      console.log(`TESTEST ${id}`);
      return true;
    };
  });
*/

export const enqueue = (job: Job, retriesRemaining: number = 5) => {
  queue.push({ job: job, retriesRemaining: retriesRemaining });
}

const reaper = async () => {
  const start = new Date();

  const element = queue.shift();
  if (element !== undefined) {
    const id = crypto.randomUUID();
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

  const end = new Date();
  const remaining = Math.max(100 - (end.getTime() - start.getTime()), 0);
  setTimeout(reaper, remaining); // process a job at most every 100ms
}

reaper();

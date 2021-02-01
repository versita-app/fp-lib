/* eslint-disable @typescript-eslint/no-explicit-any */
import Either, { left } from './either'
import { curry1 } from './helpers'
import { MapCallback } from './types/common'
import Monad from './monad'
import Task from './task'

export type TaskEitherResolve <T> = (res: T) => void
export type TaskEitherCallback <L, R> = (resolve: TaskEitherResolve<Either<L, R>>) => void

export default class TaskEither<L, R> extends Monad {
  static of <R> (r: R): TaskEither<null, R> {
    return of(r)
  }

  static reject <L> (l: L): TaskEither<L, never> {
    return reject(l)
  }

  static tryCatch <L, R> (f: () => Promise<R> | R, e: (l: Error) => L): TaskEither<L, R> {
    return tryCatch(f, e)
  }

  static fromPromise <L, R> (promise: Promise<R>): TaskEither<L, R> {
    return fromPromise(promise)
  }

  static fromEither <L, R> (either: Either<L, R>): TaskEither<L, R> {
    return fromEither(either)
  }

  static fromTask <L, R> (task: Task<R>): TaskEither<L, R> {
    return fromTask<L, R>(task)
  }

  static run <L, R> (taskeither: TaskEither<L, R>): Promise<Either<L, R>> {
    return new Promise(taskeither.computation)
  }

  static runIfValid<L, R> (x: unknown): typeof x | Promise<Either<L, R>> {
    return runIfValid<L, R>(x)
  }

  static map <L, R, R2> (f: MapCallback<R, R2>, taskeither: TaskEither<L, R>): TaskEither<L, R2> {
    return map<L, R, R2>(f, taskeither)
  }

  static chain <L, R, R2 = R> (f: MapCallback<R, TaskEither<L, R2>>, taskeither: TaskEither<L, R>): TaskEither<L, R2> {
    return chain<L, R, R2>(f, taskeither)
  }

  static ap <L, R2, R3> (task2: TaskEither<L, R2>, taskeither: TaskEither<L, (r: R2) => R3>): TaskEither<L | TypeError, R3> {
    return ap< L, R2, R3>(task2, taskeither)
  }

  computation: TaskEitherCallback<L, R>

  constructor (computation: TaskEitherCallback<L, R>) {
    super()
    this.computation = computation
  }

  run<L, R> (this: TaskEither<L, R>): Promise<Either<L, R>> {
    return run<L, R>(this)
  }

  runIfValid<L, R> (this: TaskEither<L, R>): Promise<Either<L, R>> | Promise<unknown> {
    return runIfValid<L, R>(this)
  }

  map <R2> (this: TaskEither<L, R>, f: MapCallback<R, R2>): TaskEither<L, R2> {
    return map<L, R, R2>(f, this)
  }

  chain <R2 = R> (this: TaskEither<L, R>, f: MapCallback<R, TaskEither<L, R2>>): TaskEither<L, R2> {
    return chain<L, R, R2>(f, this)
  }

  ap <R2, R3> (this: TaskEither<L, (r: R2) => R3>, task2: TaskEither<L, R2>): TaskEither<L | TypeError, R3> {
    return ap< L, R2, R3>(task2, this)
  }
}

/**
 * Creates a TaskEither that will resolve to Right<r>
 */
export function of <R> (r: R): TaskEither<null, R> {
  const taskDefault: TaskEitherCallback<never, R> = (resolve) => resolve(Either.of(r))
  return new TaskEither(taskDefault)
}

/**
 * Creates a TaskEither that will resolve to Left<l>
 */
export function reject <L> (l: L): TaskEither<L, never> {
  const taskDefault: TaskEitherCallback<L, never> = (resolve) => resolve(left(l))
  return new TaskEither(taskDefault)
}

/**
 * Takes an async function and wraps response in a Right if successful or Left if error
 */
export function tryCatch <L, R> (f: () => Promise<R> | R, e: (l: Error) => L): TaskEither<L, R> {
  return new TaskEither(async (resolve) => {
    try {
      const r = await f()
      resolve(Either.of(r))
    } catch (err) {
      resolve(left(e(err)))
    }
  })
}

/**
 * creates a TaskEither from a Promise (rejected promises will be Left, resolved will be Right)
 */
export function fromPromise <L, R> (promise: Promise<R>): TaskEither<L, R> {
  return new TaskEither((resolve) => promise
    .then((r: R) => resolve(Either.of(r)))
    .catch((l: L) => resolve(left(l))))
}

/**
 * Converts Either to TaskEither
 */
export function fromEither <L, R> (either: Either<L, R>): TaskEither<L, R> {
  return new TaskEither((resolve) => resolve(either))
}

/**
 * Converts Task to TaskEither
 */
export function fromTask <L, R> (task: Task<R>): TaskEither<L, R> {
  return new TaskEither(
    (resolve) => task.fork(
      (l) => resolve(left<L>(l)),
      (r) => resolve(Either.of<R>(r))
    )
  )
}

/**
 * Invokes the computation if x is a valid TaskEither
 */
export function runIfValid<L, R> (x: unknown): Promise<typeof x> | Promise<Either<L, R>> {
  return x instanceof TaskEither
    ? new Promise(x.computation)
    : Promise.resolve(x)
}

/**
 * Invokes the computation
 */
export function run <L, R> (taskeither: TaskEither<L, R>): Promise<Either<L, R>> {
  return new Promise(taskeither.computation)
}

/**
 * Transforms the response of the task
 * using a regular unary function if the
 * response is a Right
 */
export function map <L, R, R2> (f: MapCallback<R, R2>, taskeither: TaskEither<L, R>): TaskEither<L, R2>
export function map <L, R, R2> (f: MapCallback<R, R2>): (taskeither: TaskEither<L, R>) => TaskEither<L, R2>
export function map <L, R, R2> (f: MapCallback<R, R2>, taskeither?: TaskEither<L, R>): TaskEither<L, R2> | ((taskeither: TaskEither<L, R>) => TaskEither<L, R2>) {
  const op = (te: TaskEither<L, R>) => new TaskEither<L, R2>(
    resolve => te.computation(
      (res) => resolve(res.map(f))
    )
  )
  return curry1(op, taskeither)
}

/**
 * Transforms the response of the task
 * using a regular unary function if the
 * response is a Right and joins the TaskEithers
 */
export function chain <L, R, R2> (f: MapCallback<R, TaskEither<L, R2>>, taskeither: TaskEither<L, R>): TaskEither<L, R2>
export function chain <L, R, R2> (f: MapCallback<R, TaskEither<L, R2>>): (taskeither: TaskEither<L, R>) => TaskEither<L, R2>
export function chain <L, R, R2> (f: MapCallback<R, TaskEither<L, R2>>, taskeither?: TaskEither<L, R>): TaskEither<L, R2> | ((taskeither: TaskEither<L, R>) => TaskEither<L, R2>) {
  const op = (te: TaskEither<L, R>) => new TaskEither<L, R2>(
    (resolve) => te.computation(
      (res: Either<L, R>) => res.map((value: R) => f(value).computation(resolve))
    )
  )
  return curry1(op, taskeither)
}

/**
 * Applies the value of one resolved Right to another. Returns first Left enountered (if any)
 */
export function ap <L, R2, R3> (task2: TaskEither<any, R2>, taskeither: TaskEither<L, (r: R2) => R3>): TaskEither<L | TypeError, R3>
export function ap <L, R2, R3> (task2: TaskEither<any, R2>): (taskeither: TaskEither<L, (r: R2) => R3>) => TaskEither<L | TypeError, R3>
export function ap <L, R2, R3> (task2: TaskEither<any, R2>, taskeither?: TaskEither<L, (r: R2) => R3>): TaskEither<L | TypeError, R3> | ((taskeither: TaskEither<L, (r: R2) => R3>) => TaskEither<L | TypeError, R3>) {
  const op = (t: TaskEither<L, (r: R2) => R3>) => t.chain(f => {
    if (Monad.$valueIsMapCallback<R2, R3>(f)) {
      return task2.map(f)
    }

    return reject(TypeError('Either.$value is not a function'))
  })
  return curry1(op, taskeither)
}

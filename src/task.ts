import { MapCallback } from './types/common'
import { curry1 } from './helpers'
import Monad from './monad'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskReject = (e: any) => void
export type TaskResolve <T> = (res: T) => void
export type TaskCallback <T> = (reject: TaskReject, resolve: TaskResolve<T>) => void

type MatcherFnA<E> = (e?: string | Error) => E
type MatcherFnB<T, T1> = (res: T) => T1
type Matcher<E, T, T1> = [MatcherFnA<E>, MatcherFnB<T, T1>]

export default class Task<T> extends Monad {
  static of <T> (res: T): Task<T> {
    return of(res)
  }

  static rejected (e?: string | Error): Task<never> {
    return reject(e)
  }

  static fromPromise <T> (promise: Promise<T>): Task<T> {
    return fromPromise(promise)
  }

  fork: TaskCallback<T>

  constructor (computation: TaskCallback<T>) {
    super()
    this.fork = computation
  }

  run (this: Task<T>): Promise<T> {
    return run<T>(this)
  }

  empty (): Task<never> {
    return empty()
  }

  orElse <U> (this: Task<T>, f: (e?: string | Error) => Task<U>): Task<T | U> {
    return orElse<T, U>(f, this)
  }

  fold <E, T1> (this: Task<T>, matcher: Matcher<E, T, T1>): Task<E | T1> {
    return fold<E, T, T1>(matcher, this)
  }

  map <T1> (this: Task<T>, f: MapCallback<T, T1>): Task<T1> {
    return map<T, T1>(f, this)
  }

  ap <T1> (this: Task<T>, task: Task<never>): Task<T1> {
    return ap<T, T1>(task, this)
  }

  chain <T1> (this: Task<T>, f: (f: MapCallback<T, T1>) => Task<T1>): Task<T1> {
    return chain<T, T1>(f, this)
  }
}

/**
 * Creates a Task that will resolve to the specified value
 */
export function of<T> (res: T): Task<T> {
  const taskDefault: TaskCallback<T> = (_, resolve) => resolve(res)
  return new Task(taskDefault)
}

export const reject = (e?: string | Error): Task<never> => Task.rejected(e)

/**
 * Creates a Task from a Promise
 */
export function fromPromise <T> (promise: Promise<T>): Task<T> {
  return new Task((reject: TaskReject, resolve: TaskResolve<T>) => promise.then(resolve).catch(reject))
}

/**
 * Wraps task.fork() in a promise
 */
export function run <T> (task: Task<T>): Promise<T> {
  return new Promise((resolve: TaskResolve<T>, reject: TaskReject) => task.fork(reject, resolve))
}

/**
 * Returns a task that will never resolve
 */
export function empty (): Task<never> {
  return new Task(() => undefined)
}

/**
 * Transforms a failure value into a new Task. Does nothing if the
 * structure already contains a successful value.
 */
export function orElse <T, U> (f: (e?: string | Error) => Task<U>, task: Task<T>): Task<T | U>
export function orElse <T, U> (f: (e?: string | Error) => Task<U>): (task: Task<T>) => Task<T | U>
export function orElse <T, U> (f: (e?: string | Error) => Task<U>, task?: Task<T>): Task<T | U> | ((task: Task<T>) => Task<T | U>) {
  const op = (t: Task<T>) => new Task<T | U>(
    (reject, resolve) => t.fork(
      (e?: string | Error) => f(e).fork(reject, resolve),
      resolve
    )
  )
  return curry1(op, task)
}

/**
 * Takes two functions, applies the leftmost one to the failure value
 * and the rightmost one to the successful value depending on which
 * one is present
 */
export function fold <E, T, T1> (matcher: Matcher<E, T, T1>, task: Task<T>): Task<E | T1>
export function fold <E, T, T1> (matcher: Matcher<E, T, T1>): (task: Task<T>) => Task<E | T1>
export function fold <E, T, T1> (matcher: Matcher<E, T, T1>, task?: Task<T>): Task<E | T1> | ((task: Task<T>) => Task<E | T1>) {
  const [fa, fb] = matcher
  const op = (t: Task<T>) => new Task<E | T1>(
    (_, resolve) => t.fork(
      (e) => resolve(fa(e)),
      (b) => resolve(fb(b))
    )
  )
  return curry1(op, task)
}

/**
 * Transforms the successful value of the task
 * using a regular unary function
 */
export function map <T, T1> (f: MapCallback<T, T1>, task: Task<T>): Task<T1>
export function map <T, T1> (f: MapCallback<T, T1>): (task: Task<T>) => Task<T1>
export function map <T, T1> (f: MapCallback<T, T1>, task?: Task<T>): Task<T1> | ((task: Task<T>) => Task<T1>) {
  const op = (t: Task<T>) => new Task<T1>(
    (reject, resolve) => t.fork(
      reject,
      (b) => resolve(f(b))
    )
  )
  return curry1(op, task)
}

/**
 * Apply the successful value of one task to another
 */
export function ap <T, T1> (task2: Task<never>, task: Task<T>): Task<T1>
export function ap <T, T1> (task2: Task<never>): (task: Task<T>) => Task<T1>
export function ap <T, T1> (task2: Task<never>, task?: Task<T>): Task<T1> | ((task: Task<T>) => Task<T1>) {
  const op = (t: Task<T>) => t.chain<T1>(task2.map)
  return curry1(op, task)
}

/**
 * Transforms the successful value of the task
 * and joins the Tasks
 */
export function chain <T, T1> (f: (f: MapCallback<T, T1>) => Task<T1>, task: Task<T>): Task<T1>
export function chain <T, T1> (f: (f: MapCallback<T, T1>) => Task<T1>): (task: Task<T>) => Task<T1>
export function chain <T, T1> (f: (f: MapCallback<T, T1>) => Task<T1>, task?: Task<T>): Task<T1> | ((task: Task<T>) => Task<T1>) {
  const op = (t: Task<T>) => new Task<T1>(
    (reject, resolve) => t.fork(
      reject,
      (b) => {
        if (Monad.$valueIsMapCallback<T, Task<T1>>(f)) {
          return f(b).fork(reject, resolve)
        }

        throw new TypeError('The value passed to resolve is not a function')
      }
    )
  )
  return curry1(op, task)
}

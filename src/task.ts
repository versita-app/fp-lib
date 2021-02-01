import { MapCallback } from './types/common'
import { curry1 } from './helpers'
import Monad from './monad'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskReject = (e: any) => void
export type TaskResolve <T> = (res: T) => void
export type TaskCallback <T> = (reject: TaskReject, resolve: TaskResolve<T>) => void

type MatcherFailFn<E> = (e: string | Error) => E
type MatcherSuccessFn<T, U> = (res: T) => U
export type Matcher<E, T, U> = {Error:MatcherFailFn<E>, Success: MatcherSuccessFn<T, U>}

export default class Task<T> extends Monad {
  static of <T> (res: T): Task<T> {
    return of(res)
  }

  static reject (e?: string | Error): Task<never> {
    return reject(e)
  }

  static empty (): Task<never> {
    return empty()
  }

  static fromPromise <T> (promise: Promise<T>): Task<T> {
    return fromPromise(promise)
  }

  static run <T> (task: Task<T>): Promise<T> {
    return run(task)
  }

  static orElse <T, U> (f: (e?: string | Error) => Task<U>, task: Task<T>): Task<T | U> {
    return orElse(f, task)
  }

  static fold <E, T, U> (matcher: Matcher<E, T, U>, task: Task<T>): Promise<E | U> {
    return fold(matcher, task)
  }

  static map <T, U> (f: MapCallback<T, U>, task: Task<T>): Task<U> {
    return map(f, task)
  }

  static ap <U, V> (task2: Task<U>, task: Task<(u: U) => V>): Task<V> {
    return ap(task2, task)
  }

  static chain <T, U> (f: (v:T) => Task<U>, task: Task<T>): Task<U> {
    return chain<T, U>(f, task)
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

  fold <E, U> (this: Task<T>, matcher: Matcher<E, T, U>): Promise<E | U> {
    return fold<E, T, U>(matcher, this)
  }

  map <U> (this: Task<T>, f: MapCallback<T, U>): Task<U> {
    return map<T, U>(f, this)
  }

  ap <U, V> (this: Task<(u: U) => V>, task2: Task<U>): Task<V> {
    return ap(task2, this)
  }

  chain <U> (this: Task<T>, f: (v:T) => Task<U>): Task<U> {
    return chain<T, U>(f, this)
  }
}

/**
 * Creates a Task that will resolve to the specified value
 */
export function of<T> (res: T): Task<T> {
  const taskDefault: TaskCallback<T> = (_, resolve) => resolve(res)
  return new Task(taskDefault)
}

/**
 * Creates a Task that will reject with the specified value
 */
export const reject = (e?: string | Error): Task<never> => new Task((reject) => reject(e))

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
export function fold <E, T, U> (matcher: Matcher<E, T, U>, task: Task<T>): Promise<E | U>
export function fold <E, T, U> (matcher: Matcher<E, T, U>): (task: Task<T>) => Promise<E | U>
export function fold <E, T, U> (matcher: Matcher<E, T, U>, task?: Task<T>): Promise<E | U> | ((task: Task<T>) => Promise<E | U>) {
  const op = (t: Task<T>) => new Promise<E | U>(
    (resolve) => t.fork(
      (e) => resolve(matcher.Error(e)),
      (b) => resolve(matcher.Success(b))
    )
  )
  return curry1(op, task)
}

/**
 * Transforms the successful value of the task
 * using a regular unary function
 */
export function map <T, U> (f: MapCallback<T, U>, task: Task<T>): Task<U>
export function map <T, U> (f: MapCallback<T, U>): (task: Task<T>) => Task<U>
export function map <T, U> (f: MapCallback<T, U>, task?: Task<T>): Task<U> | ((task: Task<T>) => Task<U>) {
  const op = (t: Task<T>) => new Task<U>(
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
export function ap <U, V> (task2: Task<U>, task: Task<(u: U) => V>): Task<V>
export function ap <U, V> (task2: Task<U>): (task: Task<(u: U) => V>) => Task<V>
export function ap <U, V> (task2: Task<U>, task?: Task<(u: U) => V>): ((task: Task<(u: U) => V>) => Task<V>) | Task<V> {
  const op = (t: Task<(u: U) => V>) => new Task<V>((reject, resolve) => t.fork(
    reject,
    f => {
      if (Monad.$valueIsMapCallback<U, V>(f)) {
        return task2.map(f).fork(reject, resolve)
      }

      return reject(TypeError('Either.$value is not a function'))
    }
  ))
  return curry1(op, task)
}

/**
 * Transforms the successful value of the task
 * and joins the Tasks
 */
export function chain <T, U> (f: (v: T) => Task<U>, task: Task<T>): Task<U>
export function chain <T, U> (f: (v: T) => Task<U>): (task: Task<T>) => Task<U>
export function chain <T, U> (f: (v: T) => Task<U>, task?: Task<T>): Task<U> | ((task: Task<T>) => Task<U>) {
  const op = (t: Task<T>) => new Task<U>((reject, resolve) => t.fork(
    reject,
    v => f(v).fork(reject, resolve)
  ))
  return curry1(op, task)
}
